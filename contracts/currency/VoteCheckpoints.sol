// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20Pausable.sol";
import "./DelegatePermit.sol";

/**
 * Extension of ERC20 to support Compound-like voting and delegation. This version is more generic than Compound's,
 * and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1.
 *
 * This extension keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
 * by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
 * power can be queried through the public accessors {getVotingGons} and {getPastVotingGons}.
 *
 * By default, token balance does not account for voting power. This makes transfers cheaper. the downside is that it
 * requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
 * Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
 * will significantly increase the base gas cost of transfers.
 *
 * _Available since v4.2._
 */
abstract contract VoteCheckpoints is ERC20Pausable, DelegatePermit {
    /**
     * structure for saving past voting balances, accounting for delegation
     */
    struct Checkpoint {
        uint32 fromBlock;
        uint224 value;
    }

    /**
     * the mapping from an address to each address that it delegates to, then mapped to the amount delegated
     */
    mapping(address => mapping(address => uint256)) internal _delegates;

    /**
     * a mapping that aggregates the total delegated amounts in the mapping above
     */
    mapping(address => uint256) internal _delegatedTotals;

    /**
     * a mapping that tracks the primaryDelegates of each user
     *
     * Primary delegates can only be chosen using delegate() which sends the full balance
     * the exist to maintain the functionality that recieving tokens gives those votes to the delegate
     */
    mapping(address => address) internal _primaryDelegates;

    /**
     * mapping that tracks if an address is willing to be delegated to
     */
    mapping(address => bool) public delegationToAddressEnabled;

    /**
     * mapping that tracks if an address is unable to delegate
     */
    mapping(address => bool) public delegationFromAddressDisabled;

    /**
     * mapping to the ordered arrays of voting checkpoints for each address
     */
    mapping(address => Checkpoint[]) public checkpoints;

    /**
     * the checkpoints to track the token total supply
     */
    Checkpoint[] private _totalSupplyCheckpoints;

    /**
     * Emitted when a delegatee is delegated new votes.
     * @param delegator the delegators address
     * @param delegatee the delegatee address
     * @param amount the amount delegated
     */
    event DelegatedVotes(
        address indexed delegator,
        address indexed delegatee,
        uint256 amount
    );

    /**
     * Emitted when a token transfer or delegate change results in changes to an account's voting power.
     * @param voter the address of the voter
     * @param newVotes the new votes amount
     */
    event UpdatedVotes(address indexed voter, uint256 newVotes);

    /**
     * Emitted when an account denotes a primary delegate.
     * @param delegator the delegator address
     * @param primaryDelegate the primary delegates address
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
     * Returns the total (inflation corrected) token supply at a specified block number
     * @param _blockNumber the block number for retrieving the total supply
     * @return pastTotalSupply  the total (inflation corrected) token supply at the specified block
     */
    function totalSupplyAt(
        uint256 _blockNumber
    ) public view virtual returns (uint256 pastTotalSupply) {
        pastTotalSupply = getPastTotalSupply(_blockNumber);
        return pastTotalSupply;
    }

    /**
     * Return historical voting balance (includes delegation) at given block number.
     *
     * If the latest block number for the account is before the requested
     * block then the most recent known balance is returned. Otherwise the
     * exact block number requested is returned.
     *
     * @param _owner the account to check the balance of.
     * @param _blockNumber the block number to check the balance at the start
     *                        of. Must be less than or equal to the present
     *                        block number.
     * @return pastVotingGons historical voting balance (including delegation) at given block number
     */
    function getPastVotes(
        address _owner,
        uint256 _blockNumber
    ) public view virtual returns (uint256 pastVotingGons) {
        pastVotingGons = getPastVotingGons(_owner, _blockNumber);
        return pastVotingGons;
    }

    /**
     * Get number of checkpoints for `account`.
     * @param account the address of the account
     * @return checkPoints the number of checkpoints for the account
     */
    function numCheckpoints(
        address account
    ) public view virtual returns (uint32 checkPoints) {
        uint256 _numCheckpoints = checkpoints[account].length;
        require(
            _numCheckpoints <= type(uint32).max,
            "number of checkpoints cannot be casted safely"
        );
        checkPoints = uint32(_numCheckpoints);
        return checkPoints;
    }

    /**
     * Set yourself as willing to recieve delegates.
     */
    function enableDelegationTo() public {
        require(
            isOwnDelegate(msg.sender),
            "Cannot enable delegation if you have outstanding delegation"
        );

        delegationToAddressEnabled[msg.sender] = true;
        delegationFromAddressDisabled[msg.sender] = true;
    }

    /**
     * Set yourself as no longer recieving delegates.
     */
    function disableDelegationTo() public {
        delegationToAddressEnabled[msg.sender] = false;
    }

    /**
     * Set yourself as being able to delegate again.
     * also disables delegating to you
     * NOTE: the condition for this is not easy and cannot be unilaterally achieved
     */
    function reenableDelegating() public {
        delegationToAddressEnabled[msg.sender] = false;

        require(
            _balances[msg.sender] == getVotingGons(msg.sender) &&
                isOwnDelegate(msg.sender),
            "Cannot re-enable delegating if you have outstanding delegations to you"
        );

        delegationFromAddressDisabled[msg.sender] = false;
    }

    /**
     * Returns true if the user has no amount of their balance delegated, otherwise false.
     * @param account the account address to check for delegation
     * @return noDelegation true if the user has no amount of their balance delegated, otherwise false.
     */
    function isOwnDelegate(
        address account
    ) public view returns (bool noDelegation) {
        noDelegation = _delegatedTotals[account] == 0;
        return noDelegation;
    }

    /**
     * Get the primary address `account` is currently delegating to. Defaults to the account address itself if none specified.
     * the primary delegate is the one that is delegated any new funds the address recieves.
     * @param account the address of the account to check for primary delgate
     * @return primaryDelegate the primary delegate for the account
     */
    function getPrimaryDelegate(
        address account
    ) public view virtual returns (address primaryDelegate) {
        address _voter = _primaryDelegates[account];
        primaryDelegate = _voter == address(0) ? account : _voter;
        return primaryDelegate;
    }

    /**
     * sets the primaryDelegate and emits an event to track it
     * @param delegator the address of the delegator
     * @param delegatee the address of the delegatee
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
     * Gets the current votes balance in gons for `account`
     * @param account the address of the account
     * @return votingGons the current votes balance in gons for the acccount
     */
    function getVotingGons(
        address account
    ) public view returns (uint256 votingGons) {
        Checkpoint[] memory accountCheckpoints = checkpoints[account];
        uint256 pos = accountCheckpoints.length;
        votingGons = (pos == 0) ? 0 : accountCheckpoints[pos - 1].value;
        return votingGons;
    }

    /**
     * Retrieve the number of votes in gons for `account` at the end of `blockNumber`.
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     * @param account the address of the account to get the votes for
     * @param blockNumber the blockNumber to get the votes for
     * @return pastVotingGons the number of votes in gons for the account and block number
     */
    function getPastVotingGons(
        address account,
        uint256 blockNumber
    ) public view returns (uint256 pastVotingGons) {
        require(
            blockNumber < block.number,
            "VoteCheckpoints: block not yet mined"
        );
        pastVotingGons = _checkpointsLookup(checkpoints[account], blockNumber);
        return pastVotingGons;
    }

    /**
     * Retrieve the `totalSupply` at the end of `blockNumber`. Note, this value is the sum of all balances.
     * It is NOT the sum of all the delegated votes!
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     * @param blockNumber the block number to get the past total supply
     * @return pastTotalSupply the totalSupply at the end of blockNumber calculated by summing all balances.
     */
    function getPastTotalSupply(
        uint256 blockNumber
    ) public view returns (uint256 pastTotalSupply) {
        require(
            blockNumber < block.number,
            "VoteCheckpoints: block not yet mined"
        );
        pastTotalSupply = _checkpointsLookup(
            _totalSupplyCheckpoints,
            blockNumber
        );
        return pastTotalSupply;
    }

    /**
     * Lookup a value in a list of (sorted) checkpoints.
     *
     * This function runs a binary search to look for the last checkpoint taken before `blockNumber`.
     *
     * During the loop, the index of the wanted checkpoint remains in the range [low-1, high).
     * With each iteration, either `low` or `high` is moved towards the middle of the range to maintain the invariant.
     *
     * - If the middle checkpoint is after `blockNumber`, the next iteration looks in [low, mid)
     * - If the middle checkpoint is before or equal to `blockNumber`, the next iteration looks in [mid+1, high)
     *
     * Once it reaches a single value (when low == high), it has found the right checkpoint at the index high-1, if not
     * out of bounds (in which case it's looking too far in the past and the result is 0).
     * Note that if the latest checkpoint available is exactly for `blockNumber`, it will end up with an index that is
     * past the end of the array, so this technically doesn't find a checkpoint after `blockNumber`, but the result is
     * the same.
     * @param ckpts list of sorted checkpoints
     * @param blockNumber the blockNumber to seerch for the last checkpoint taken before
     * @return checkPoint the checkpoint
     */
    function _checkpointsLookup(
        Checkpoint[] storage ckpts,
        uint256 blockNumber
    ) internal view returns (uint256 checkPoint) {
        uint256 ckptsLength = ckpts.length;
        if (ckptsLength == 0) return 0;
        Checkpoint memory lastCkpt = ckpts[ckptsLength - 1];
        if (blockNumber >= lastCkpt.fromBlock) return lastCkpt.value;

        uint256 high = ckptsLength;
        uint256 low = 0;

        while (low < high) {
            uint256 mid = low + ((high - low) >> 1);
            if (ckpts[mid].fromBlock > blockNumber) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        checkPoint = high == 0 ? 0 : ckpts[high - 1].value;
        return checkPoint;
    }

    /**
     * Delegate all votes from the sender to `delegatee`.
     * NOTE: This function assumes that you do not have partial delegations
     * It will revert with "Must have an undelegated amount available to cover delegation" if you do
     * @param delegatee the address of the delegatee
     */
    function delegate(address delegatee) public {
        require(
            delegatee != msg.sender,
            "Use undelegate instead of delegating to yourself"
        );

        require(
            delegationToAddressEnabled[delegatee],
            "Primary delegates must enable delegation"
        );

        if (!isOwnDelegate(msg.sender)) {
            undelegateFromAddress(getPrimaryDelegate(msg.sender));
        }

        uint256 _amount = _balances[msg.sender];
        _delegate(msg.sender, delegatee, _amount);
        _setPrimaryDelegate(msg.sender, delegatee);
    }

    /**
     * Delegate all votes from the sender to `delegatee`.
     * NOTE: This function assumes that you do not have partial delegations
     * It will revert with "Must have an undelegated amount available to cover delegation" if you do
     * @param delegator The address delegating
     * @param delegatee The address being delegated to
     * @param deadline The deadling of the delegation after which it will be invalid
     * @param v The v part of the signature
     * @param r The r part of the signature
     * @param s The s part of the signature
     */
    function delegateBySig(
        address delegator,
        address delegatee,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(delegator != delegatee, "Do not delegate to yourself");
        require(
            delegationToAddressEnabled[delegatee],
            "Primary delegates must enable delegation"
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
     * Delegate an `amount` of votes from the sender to `delegatee`.
     * @param delegatee The address being delegated to
     * @param amount The amount of votes
     */
    function delegateAmount(address delegatee, uint256 amount) public {
        require(delegatee != msg.sender, "Do not delegate to yourself");

        _delegate(msg.sender, delegatee, amount);
    }

    /**
     * Change delegation for `delegator` to `delegatee`.
     *
     * Emits events {NewDelegatedAmount} and {UpdatedVotes}.
     */
    function _delegate(
        address delegator,
        address delegatee,
        uint256 amount
    ) internal virtual {
        require(
            amount <= _balances[delegator] - _delegatedTotals[delegator],
            "Must have an undelegated amount available to cover delegation"
        );

        require(
            !delegationFromAddressDisabled[delegator],
            "Cannot delegate if you have enabled primary delegation to yourself and/or have outstanding delegates"
        );

        emit DelegatedVotes(delegator, delegatee, amount);

        _delegates[delegator][delegatee] += amount;
        _delegatedTotals[delegator] += amount;

        _moveVotingPower(delegator, delegatee, amount);
    }

    /**
     * Undelegate all votes from the sender's primary delegate.
     */
    function undelegate() public {
        address _primaryDelegate = getPrimaryDelegate(msg.sender);
        require(
            _primaryDelegate != msg.sender,
            "Must specifiy address without a Primary Delegate"
        );
        undelegateFromAddress(_primaryDelegate);
    }

    /**
     * Undelegate votes from the `delegatee` back to the sender.
     * @param delegatee the delegatee address
     */
    function undelegateFromAddress(address delegatee) public {
        _undelegateFromAddress(msg.sender, delegatee);
    }

    /**
     * Undelegate votes from the `delegatee` back to the delegator.
     */
    function _undelegateFromAddress(
        address delegator,
        address delegatee
    ) internal {
        uint256 _amount = _delegates[delegator][delegatee];
        _undelegate(delegator, delegatee, _amount);
        if (delegatee == getPrimaryDelegate(delegator)) {
            _setPrimaryDelegate(delegator, address(0));
        }
    }

    /**
     * Undelegate a specific amount of votes from the `delegatee` back to the sender.
     * @param delegatee The address being delegated to
     * @param amount The amount of votes
     */
    function undelegateAmountFromAddress(
        address delegatee,
        uint256 amount
    ) public {
        require(
            _delegates[msg.sender][delegatee] >= amount,
            "amount not available to undelegate"
        );
        require(
            msg.sender == getPrimaryDelegate(msg.sender),
            "undelegating amounts is only available for partial delegators"
        );
        _undelegate(msg.sender, delegatee, amount);
    }

    function _undelegate(
        address delegator,
        address delegatee,
        uint256 amount
    ) internal virtual {
        _delegatedTotals[delegator] -= amount;
        _delegates[delegator][delegatee] -= amount;

        _moveVotingPower(delegatee, delegator, amount);
    }

    /**
     * Maximum token supply. Defaults to `type(uint224).max` (2^224^ - 1).
     */
    function _maxSupply() internal view virtual returns (uint224) {
        return type(uint224).max;
    }

    /**
     * Snapshots the totalSupply after it has been increased.
     * @param account the account to mint from
     * @param amount the amount to mint
     */
    function _mint(
        address account,
        uint256 amount
    ) internal virtual override returns (uint256) {
        amount = super._mint(account, amount);
        require(
            totalSupply() <= _maxSupply(),
            "VoteCheckpoints: total supply risks overflowing votes"
        );

        _writeCheckpoint(_totalSupplyCheckpoints, _add, amount);
        return amount;
    }

    /**
     * Snapshots the totalSupply after it has been decreased.
     * @param account the account to burn from
     * @param amount the amount to burn
     */
    function _burn(
        address account,
        uint256 amount
    ) internal virtual override returns (uint256) {
        amount = super._burn(account, amount);

        _writeCheckpoint(_totalSupplyCheckpoints, _subtract, amount);
        return amount;
    }

    /**
     * Move voting power when tokens are transferred.
     *
     * Emits a {UpdatedVotes} event.
     * @param from the transfer from address
     * @param to the transfer to address
     * @param amount the amount transferred
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
                _delegatedTotals[from];

            // check to see if tokens must be undelegated to transefer
            if (_undelegatedAmount < amount) {
                address _sourcePrimaryDelegate = getPrimaryDelegate(from);
                uint256 _sourcePrimaryDelegatement = _delegates[from][
                    _sourcePrimaryDelegate
                ];

                require(
                    amount <= _undelegatedAmount + _sourcePrimaryDelegatement,
                    "Delegation too complicated to transfer. Undelegate and simplify before trying again"
                );

                _undelegate(
                    from,
                    _sourcePrimaryDelegate,
                    amount - _undelegatedAmount
                );
            }
        }

        address _destPrimaryDelegate = _primaryDelegates[to];
        // saving gas by manually doing isOwnDelegate since this function already needs to read the data for this conditional
        if (_destPrimaryDelegate != address(0)) {
            _delegates[to][_destPrimaryDelegate] += amount;
            _delegatedTotals[to] += amount;
            _moveVotingPower(from, _destPrimaryDelegate, amount);
        } else {
            _moveVotingPower(from, to, amount);
        }
    }

    function _moveVotingPower(
        address src,
        address dst,
        uint256 amount
    ) private {
        if (src != dst && amount > 0) {
            if (src != address(0)) {
                uint256 newWeight = _writeCheckpoint(
                    checkpoints[src],
                    _subtract,
                    amount
                );
                emit UpdatedVotes(src, newWeight);
            }

            if (dst != address(0)) {
                uint256 newWeight = _writeCheckpoint(
                    checkpoints[dst],
                    _add,
                    amount
                );
                emit UpdatedVotes(dst, newWeight);
            }
        }
    }

    /**
     * returns the newly written value in the checkpoint
     */
    function _writeCheckpoint(
        Checkpoint[] storage ckpts,
        function(uint256, uint256) view returns (uint256) op,
        uint256 delta
    ) internal returns (uint256) {
        require(
            delta <= type(uint224).max,
            "newWeight cannot be casted safely"
        );
        require(
            block.number <= type(uint32).max,
            "block number cannot be casted safely"
        );

        uint256 pos = ckpts.length;

        /* if there are no checkpoints, just write the value
         * This part assumes that an account would never exist with a balance but without checkpoints.
         * This function cannot be called directly, so there's no malicious way to exploit this. If this
         * is somehow called with op = _subtract, it will revert as that action is nonsensical.
         */
        if (pos == 0) {
            ckpts.push(
                Checkpoint({
                    fromBlock: uint32(block.number),
                    value: uint224(op(0, delta))
                })
            );
            return delta;
        }

        // else, iterate on the existing checkpoints as per usual
        Checkpoint storage newestCkpt = ckpts[pos - 1];

        uint256 oldWeight = newestCkpt.value;
        uint256 newWeight = op(oldWeight, delta);

        require(
            newWeight <= type(uint224).max,
            "newWeight cannot be casted safely"
        );

        if (newestCkpt.fromBlock == block.number) {
            newestCkpt.value = uint224(newWeight);
        } else {
            ckpts.push(
                Checkpoint({
                    fromBlock: uint32(block.number),
                    value: uint224(newWeight)
                })
            );
        }
        return newWeight;
    }

    function _add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    function _subtract(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    function _replace(uint256, uint256 b) internal pure returns (uint256) {
        return b;
    }
}
