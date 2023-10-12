// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20Pausable.sol";
import "./DelegatePermit.sol";
import "./ERC20MintAndBurn.sol";

/**
 * This contract tracks delegations of an ERC20 token by tokenizing the delegations
 * It assumes a companion token that is transferred to denote changes in votes brought
 * on by both transfers (via _afterTokenTransfer hooks) and delegations.
 * The secondary token creates allowances whenever it delegates to allow for reclaiming the voting power later
 *
 * Voting power can be queried through the public accessor {voteBalanceOf}. Vote power can be delegated either
 * by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}.
 * Delegates need to disable their own ability to delegate to enable others to delegate to them.
 *
 * Raw delegations can be done in partial amounts via {delegateAmount}. This is intended for contracts which can run
 * their own internal ledger of delegations and will prevent you from transferring the delegated funds until you undelegate.
 */
abstract contract ERC20Delegated is ERC20MintAndBurn, DelegatePermit {
    // this checks who has opted in to voting
    mapping(address => bool) public voter;

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
     * @dev Emitted when a token transfer or delegate change results a transfer of voting power.
     */
    event VoteTransfer(
        address indexed sendingVoter,
        address indexed recievingVoter,
        uint256 votes
    );

    /**
     * @dev Emitted when an account denotes a primary delegate.
     */
    event NewPrimaryDelegate(
        address indexed delegator,
        address indexed primaryDelegate
    );

    constructor(
        Policy _policy,
        string memory _name,
        string memory _symbol,
        address _initialPauser
    ) ERC20MintAndBurn(_policy, _name, _symbol, _initialPauser) {
        // call to super constructor
    }

    function enableVoting() public {
        require(!voter[msg.sender], "ERC20Delegated: voting already enabled");

        voter[msg.sender] = true;
        _voteMint(msg.sender, _balances[msg.sender]);
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
            _balances[msg.sender] == _voteBalances[msg.sender] &&
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
            "ERC20Delegated: a primary delegate must enable delegation"
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
            "ERC20Delegated: a primary delegate must enable delegation"
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
        require(
            delegatee != msg.sender,
            "ERC20Delegated: use undelegate instead of delegating to yourself"
        );
        require(
            delegatee != address(0),
            "ERC20Delegated: cannot delegate to the zero address"
        );

        _delegate(msg.sender, delegatee, amount);
    }

    /**
     * @dev Change delegation for `delegator` to `delegatee`.
     *
     * Emits events {NewDelegatedAmount} and {VoteTransfer}.
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
     * A primary delegated individual can revoke delegations of unwanted delegators
     * Useful for allowing yourself to call reenableDelegating after calling disableDelegationTo
     */
    function revokeDelegation(address delegator) public {
        address _primaryDelegate = getPrimaryDelegate(delegator);
        require(
            (delegator != msg.sender) && (_primaryDelegate == msg.sender),
            "ERC20Delegated: can only revoke delegations to yourself"
        );
        _undelegateFromAddress(delegator, msg.sender);
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
     * Emits a {VoteTransfer} event.
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

        bool fromVoter = voter[from];

        // if the address has delegated, they might be transfering tokens allotted to someone else
        if (fromVoter && !isOwnDelegate(from)) {
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

        if (voter[to]) {
            address _voteDestination = to;
            address _destPrimaryDelegate = _primaryDelegates[to];
            // saving gas by manually doing a form of isOwnDelegate since this function already needs to read the data for this conditional
            if (_destPrimaryDelegate != address(0)) {
                _increaseVoteAllowance(_destPrimaryDelegate, to, amount);
                _totalVoteAllowances[to] += amount;
                _voteDestination = _destPrimaryDelegate;
            }

            if (fromVoter) {
                _voteTransfer(from, _voteDestination, amount);
            } else {
                _voteMint(_voteDestination, amount);
            }
        } else {
            if (fromVoter) {
                _voteBurn(from, amount);
            }
        }
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
     * is instead more restrictive, only allows for transfers where the recipient owns the allowance
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
        _beforeVoteTokenTransfer(sender, recipient, amount);

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

        emit VoteTransfer(sender, recipient, amount);

        _afterVoteTokenTransfer(sender, recipient, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function _voteMint(
        address account,
        uint256 amount
    ) internal virtual returns (uint256) {
        require(
            account != address(0),
            "ERC20Delegated: vote mint to the zero address"
        );

        _beforeVoteTokenTransfer(address(0), account, amount);

        // _voteTotalSupply += amount;

        _voteBalances[account] += amount;
        emit VoteTransfer(address(0), account, amount);

        _afterVoteTokenTransfer(address(0), account, amount);

        return amount;
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _voteBurn(
        address account,
        uint256 amount
    ) internal virtual returns (uint256) {
        _beforeVoteTokenTransfer(account, address(0), amount);

        uint256 accountBalance = _voteBalances[account];
        require(
            accountBalance >= amount,
            "ERC20Delegated: vote burn amount exceeds balance"
        );
        unchecked {
            _voteBalances[account] = accountBalance - amount;
        }
        // _voteTotalSupply -= amount;

        emit VoteTransfer(account, address(0), amount);

        _afterVoteTokenTransfer(account, address(0), amount);

        return amount;
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

    /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeVoteTokenTransfer(
        address, // from
        address, // to
        uint256 amount
    ) internal virtual {}

    /**
     * @dev Hook that is called after any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * has been transferred to `to`.
     * - when `from` is zero, `amount` tokens have been minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens have been burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterVoteTokenTransfer(
        address, // from
        address, // to
        uint256 amount
    ) internal virtual {}
}
