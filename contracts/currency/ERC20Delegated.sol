// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20Pausable.sol";
import "./DelegatePermit.sol";

/**
 * This contract tracks delegations of an ERC20 token by tokenizing the delegations
 * It assumes a virtual secondary token that is transferred to denote changes in votes
 * The secondary token is then coupled to the transfers of the underlying token via _afterTokenTransfer hooks
 */
abstract contract ERC20Delegated is ERC20Pausable, DelegatePermit {
    // this balance tracks the amount of votes an address has for snapshot purposes
    mapping(address => uint256) internal _voteBalances;

    // allowances are created to allow for undelegation and to track delegated amounts
    mapping(address => mapping(address => uint256)) private _voteAllowances;

    // total allowances helps track if an account is delegated
    // its value is equivalent to agregating across the middle value of the previous mapping
    mapping(address => uint256) private _totalVoteAllowances;

    /** a mapping that tracks the primaryDelegates of each user
     *
     * Primary delegates can only be chosen using delegate() which sends the full balance
     * The exist to maintain the functionality that recieving tokens gives those votes to the delegate
     */
    mapping(address => address) internal _primaryDelegates;

    // mapping that tracks if an address is willing to be delegated to
    mapping(address => bool) public delegationToAddressEnabled;

    // mapping that tracks if an address is unable to delegate
    mapping(address => bool) public delegationFromAddressDisabled;

    /**
     * @dev Emitted when a delegatee is delegated new votes.
     */
    event DelegatedVotes(
        address indexed delegator,
        address indexed delegatee,
        uint256 amount
    );

    /**
     * @dev Emitted when a token transfer or delegate change results in changes to an account's voting power.
     */
    event UpdatedVotes(address indexed voter, uint256 newVotes);

    /**
     * @dev Emitted when an account denotes a primary delegate.
     */
    event NewPrimaryDelegate(
        address indexed delegator,
        address indexed primaryDelegate
    );

    constructor(
        string memory _name,
        string memory _symbol,
        address admin,
        address _initialPauser
    ) ERC20Pausable(_name, _symbol, admin, _initialPauser) {
        // call to super constructor
    }

    /**
     * @dev Set yourself as willing to recieve delegates.
     */
    function enableDelegationTo() public {
        require(
            isOwnDelegate(msg.sender),
            "ERC20Delegated: cannot enable delegation if you have outstanding delegation"
        );

        delegationToAddressEnabled[msg.sender] = true;
        delegationFromAddressDisabled[msg.sender] = true;
    }

    /**
     * @dev Set yourself as no longer recieving delegates.
     */
    function disableDelegationTo() public {
        delegationToAddressEnabled[msg.sender] = false;
    }

    /**
     * @dev Set yourself as being able to delegate again.
     * also disables delegating to you
     */
    function reenableDelegating() public {
        delegationToAddressEnabled[msg.sender] = false;

        require(
            _balances[msg.sender] == voteBalanceOf(msg.sender) &&
                isOwnDelegate(msg.sender),
            "ERC20Delegated: cannot re-enable delegating if you have outstanding delegations"
        );

        delegationFromAddressDisabled[msg.sender] = false;
    }

    /**
     * @dev Returns true if the user has no amount of their balance delegated, otherwise false.
     */
    function isOwnDelegate(address account) public view returns (bool) {
        return _totalVoteAllowances[account] == 0;
    }

    /**
     * @dev Get the primary address `account` is currently delegating to. Defaults to the account address itself if none specified.
     * The primary delegate is the one that is delegated any new funds the address recieves.
     */
    function getPrimaryDelegate(
        address account
    ) public view virtual returns (address) {
        address _voter = _primaryDelegates[account];
        return _voter == address(0) ? account : _voter;
    }

    /**
     * sets the primaryDelegate and emits an event to track it
     */
    function _setPrimaryDelegate(
        address delegator,
        address delegatee
    ) internal {
        _primaryDelegates[delegator] = delegatee;

        emit NewPrimaryDelegate(
            delegator,
            delegatee == address(0) ? delegator : delegatee
        );
    }

    /**
     * @dev Delegate all votes from the sender to `delegatee`.
     * NOTE: This function assumes that you do not have partial delegations
     * It will revert with "ERC20Delegated: must have an undelegated amount available to cover delegation" if you do
     */
    function delegate(address delegatee) public {
        require(
            delegatee != msg.sender,
            "ERC20Delegated: use undelegate instead of delegating to yourself"
        );

        require(
            delegationToAddressEnabled[delegatee],
            "ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates"
        );

        if (!isOwnDelegate(msg.sender)) {
            undelegateFromAddress(getPrimaryDelegate(msg.sender));
        }

        uint256 _amount = _balances[msg.sender];
        _delegate(msg.sender, delegatee, _amount);
        _setPrimaryDelegate(msg.sender, delegatee);
    }

    /**
     * @dev Delegate all votes from the sender to `delegatee`.
     * NOTE: This function assumes that you do not have partial delegations
     * It will revert with "ERC20Delegated: must have an undelegated amount available to cover delegation" if you do
     */
    function delegateBySig(
        address delegator,
        address delegatee,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(
            delegator != delegatee,
            "ERC20Delegated: use undelegate instead of delegating to yourself"
        );
        require(
            delegationToAddressEnabled[delegatee],
            "ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates"
        );

        if (!isOwnDelegate(delegator)) {
            _undelegateFromAddress(delegator, getPrimaryDelegate(delegator));
        }

        _verifyDelegatePermit(delegator, delegatee, deadline, v, r, s);

        uint256 _amount = _balances[delegator];
        _delegate(delegator, delegatee, _amount);
        _setPrimaryDelegate(delegator, delegatee);
    }

    /**
     * @dev Delegate an `amount` of votes from the sender to `delegatee`.
     */
    function delegateAmount(address delegatee, uint256 amount) public {
        require(delegatee != msg.sender, "Do not delegate to yourself");

        _delegate(msg.sender, delegatee, amount);
    }

    /**
     * @dev Change delegation for `delegator` to `delegatee`.
     *
     * Emits events {NewDelegatedAmount} and {UpdatedVotes}.
     */
    function _delegate(
        address delegator,
        address delegatee,
        uint256 amount
    ) internal virtual {
        // more strict that the transfer requirement
        require(
            amount <= _balances[delegator] - _totalVoteAllowances[delegator],
            "ERC20Delegated: must have an undelegated amount available to cover delegation"
        );

        require(
            !delegationFromAddressDisabled[delegator],
            "ERC20Delegated: cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates"
        );

        emit DelegatedVotes(delegator, delegatee, amount);

        _voteTransfer(delegator, delegatee, amount);
        // create allowance to reclaim token
        _increaseVoteAllowance(delegatee, delegator, amount);
        // track owed votes
        _totalVoteAllowances[delegator] += amount;
    }

    /**
     * @dev Undelegate all votes from the sender's primary delegate.
     */
    function undelegate() public {
        address _primaryDelegate = getPrimaryDelegate(msg.sender);
        require(
            _primaryDelegate != msg.sender,
            "ERC20Delegated: must specifiy undelegate address when not using a Primary Delegate"
        );
        undelegateFromAddress(_primaryDelegate);
    }

    /**
     * @dev Undelegate votes from the `delegatee` back to the sender.
     */
    function undelegateFromAddress(address delegatee) public {
        _undelegateFromAddress(msg.sender, delegatee);
    }

    /**
     * @dev Undelegate votes from the `delegatee` back to the delegator.
     */
    function _undelegateFromAddress(
        address delegator,
        address delegatee
    ) internal {
        uint256 _amount = voteAllowance(delegatee, delegator);
        _undelegate(delegator, delegatee, _amount);
        if (delegatee == getPrimaryDelegate(delegator)) {
            _setPrimaryDelegate(delegator, address(0));
        }
    }

    /**
     * @dev Undelegate a specific amount of votes from the `delegatee` back to the sender.
     */
    function undelegateAmountFromAddress(
        address delegatee,
        uint256 amount
    ) public {
        require(
            voteAllowance(delegatee, msg.sender) >= amount,
            "ERC20Delegated: amount not available to undelegate"
        );
        require(
            msg.sender == getPrimaryDelegate(msg.sender),
            "ERC20Delegated: undelegating amounts is only available for partial delegators"
        );
        _undelegate(msg.sender, delegatee, amount);
    }

    function _undelegate(
        address delegator,
        address delegatee,
        uint256 amount
    ) internal virtual {
        _totalVoteAllowances[delegator] -= amount;
        _voteTransferFrom(delegatee, delegator, amount);
    }

    /**
     * @dev Move voting power when tokens are transferred.
     *
     * Emits a {UpdatedVotes} event.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (from == to) {
            // self transfers require no change in delegation and can be the source of exploits
            return;
        }

        // if the address has delegated, they might be transfering tokens allotted to someone else
        if (!isOwnDelegate(from)) {
            uint256 _undelegatedAmount = _balances[from] +
                amount -
                _totalVoteAllowances[from];

            // check to see if tokens must be undelegated to transfer
            if (_undelegatedAmount < amount) {
                address _sourcePrimaryDelegate = getPrimaryDelegate(from);
                uint256 _sourcePrimaryDelegatement = voteAllowance(
                    _sourcePrimaryDelegate,
                    from
                );

                require(
                    amount <= _undelegatedAmount + _sourcePrimaryDelegatement,
                    "ERC20Delegated: delegation too complicated to transfer. Undelegate and simplify before trying again"
                );

                _undelegate(
                    from,
                    _sourcePrimaryDelegate,
                    amount - _undelegatedAmount
                );
            }
        }

        address _destPrimaryDelegate = _primaryDelegates[to];
        address _voteDestination = to;
        // saving gas by manually doing isOwnDelegate since this function already needs to read the data for this conditional
        if (_destPrimaryDelegate != address(0)) {
            _increaseVoteAllowance(_destPrimaryDelegate, to, amount);
            _totalVoteAllowances[to] += amount;
            _voteDestination = _destPrimaryDelegate;
        }

        _voteTransfer(from, _voteDestination, amount);
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function voteBalanceOf(
        address account
    ) public view virtual returns (uint256) {
        return _voteBalances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function voteTransfer(
        address recipient,
        uint256 amount
    ) internal virtual returns (bool) {
        _voteTransfer(msg.sender, recipient, amount);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function voteAllowance(
        address owner,
        address spender
    ) internal view virtual returns (uint256) {
        return _voteAllowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function voteApprove(
        address spender,
        uint256 amount
    ) internal virtual returns (bool) {
        _voteApprove(msg.sender, spender, amount);
        return true;
    }

    /**
     * not the same as ERC20 transferFrom
     * is instead more restrictive, only allows for
     */
    function _voteTransferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual returns (bool) {
        _voteTransfer(sender, recipient, amount);

        uint256 currentAllowance = _voteAllowances[sender][recipient];
        require(
            currentAllowance >= amount,
            "ERC20Delegated: vote transfer amount exceeds allowance"
        );
        unchecked {
            _voteApprove(sender, recipient, currentAllowance - amount);
        }

        return true;
    }

    /**
     * @dev Moves `amount` of tokens from `sender` to `recipient`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _voteTransfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual {
        if (sender != address(0)) {
            uint256 senderBalance = _voteBalances[sender];
            require(
                senderBalance >= amount,
                "ERC20Delegated: vote transfer amount exceeds balance"
            );
            unchecked {
                _voteBalances[sender] = senderBalance - amount;
            }
        }

        if (recipient != address(0)) {
            _voteBalances[recipient] += amount;
        }

        emit UpdatedVotes(recipient, amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _voteApprove(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(
            spender != address(0),
            "ERC20Delegate: approve votes to the zero address"
        );

        _voteAllowances[owner][spender] = amount;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function _increaseVoteAllowance(
        address owner,
        address spender,
        uint256 addedValue
    ) internal virtual returns (bool) {
        _voteApprove(
            owner,
            spender,
            _voteAllowances[owner][spender] + addedValue
        );
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function _decreaseVoteAllowance(
        address owner,
        address spender,
        uint256 subtractedValue
    ) internal virtual returns (bool) {
        uint256 currentAllowance = _voteAllowances[owner][spender];
        require(
            currentAllowance >= subtractedValue,
            "ERC20Delegated: decreased vote allowance below zero"
        );
        unchecked {
            _voteApprove(owner, spender, currentAllowance - subtractedValue);
        }

        return true;
    }

    // /**
    //  * @dev Snapshots the totalSupply after it has been increased.
    //  */
    // function _mint(
    //     address account,
    //     uint256 amount
    // ) internal virtual override returns (uint256) {
    //     amount = super._mint(account, amount);
    //     return amount;
    // }

    // /**
    //  * @dev Snapshots the totalSupply after it has been decreased.
    //  */
    // function _burn(
    //     address account,
    //     uint256 amount
    // ) internal virtual override returns (uint256) {
    //     amount = super._burn(account, amount);
    //     return amount;
    // }
}
