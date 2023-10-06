// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20Delegated.sol";

/**
 * @dev Extension of ERC20 to support Compound-like snapshotting. This version is more generic than Compound's,
 * and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1.
 *
 * This extension keeps a history (snapshots) of each account's vote power at each snapshot point.
 * Voting power values at snapshots can be accessed directly via {voteBalanceOfAt} or though the overridable
 * accessor of
 */
abstract contract VoteSnapshotCheckpoints is ERC20Delegated {
    // structure for saving past voting balances, accounting for delegation
    struct Checkpoint {
        uint32 snapshotId;
        uint224 value;
    }

    uint32 public currentSnapshotId;

    // mapping to the ordered arrays of voting checkpoints for each address
    mapping(address => Checkpoint[]) public checkpoints;

    // the checkpoints to track the token total supply
    Checkpoint[] private _totalSupplyCheckpoints;

    /** Construct a new instance.
     *
     * Note that it is always necessary to call reAuthorize on the balance store
     * after it is first constructed to populate the authorized interface
     * contracts cache. These calls are separated to allow the authorized
     * contracts to be configured/deployed after the balance store contract.
     */
    constructor(
        Policy _policy,
        string memory _name,
        string memory _symbol,
        address _initialPauser
    ) ERC20Delegated(_policy, _name, _symbol, _initialPauser) {
        _snapshot();
    }

    function initialize(
        address _self
    ) public virtual override onlyConstruction {
        super.initialize(_self);
        _snapshot();
    }

    /**
     * @dev Emitted by {_snapshot} when a snapshot identified by `id` is created.
     */
    event Snapshot(uint256 id);

    /**
     * @dev Get number of checkpoints for `account`.
     */
    function numCheckpoints(
        address account
    ) public view virtual returns (uint256) {
        return checkpoints[account].length;
    }

    /**
     * Return historical voting balance (includes delegation) at given block number.
     *
     * If the latest block number for the account is before the requested
     * block then the most recent known balance is returned. Otherwise the
     * exact block number requested is returned.
     *
     * @param account The account to check the balance of.
     * @param snapshotId The block number to check the balance at the start
     *                        of. Must be less than or equal to the present
     *                        block number.
     */
    function voteBalanceOfAt(
        address account,
        uint256 snapshotId
    ) public view virtual returns (uint256) {
        require(snapshotId <= currentSnapshotId, "must be past snapshot");
        (uint256 value, bool snapshotted) = _checkpointsLookup(
            checkpoints[account],
            snapshotId
        );
        return snapshotted ? value : _voteBalances[account];
    }

    /**
     * @dev Retrieve the `totalSupply` at the end of `blockNumber`. Note, this value is the sum of all balances.
     * It is NOT the sum of all the delegated votes!
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function totalSupplyAt(
        uint256 snapshotId
    ) public view virtual returns (uint256) {
        require(snapshotId <= currentSnapshotId, "must be past snapshot");
        (uint256 value, bool snapshotted) = _checkpointsLookup(
            _totalSupplyCheckpoints,
            snapshotId
        );
        return snapshotted ? value : _totalSupply;
    }

    /**
     * @dev Creates a new snapshot and returns its snapshot id.
     *
     * Emits a {Snapshot} event that contains the same id.
     */
    function _snapshot() internal virtual returns (uint256) {
        // the math will error if the snapshot overflows
        uint32 newId = ++currentSnapshotId;

        emit Snapshot(newId);
        return newId;
    }

    // Update balance and/or total supply snapshots before the values are modified. This is implemented
    // in the _beforeTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override returns (uint256) {
        if (from == address(0)) {
            // mint
            _updateTotalSupplySnapshot();
        } else if (to == address(0)) {
            // burn
            _updateTotalSupplySnapshot();
        }

        return super._beforeTokenTransfer(from, to, amount);
    }

    function _beforeVoteTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override returns (uint256) {
        if (from != address(0)) {
            _updateAccountSnapshot(from);
        }
        if (to != address(0)) {
            _updateAccountSnapshot(to);
        }

        return super._beforeTokenTransfer(from, to, amount);
    }

    function _updateAccountSnapshot(address account) private {
        _updateSnapshot(checkpoints[account], _voteBalances[account]);
    }

    function _updateTotalSupplySnapshot() private {
        _updateSnapshot(_totalSupplyCheckpoints, _totalSupply);
    }

    function _updateSnapshot(
        Checkpoint[] storage snapshots,
        uint256 currentValue
    ) internal {
        uint256 numSnapshots = snapshots.length;

        if (numSnapshots == 0) {
            require(
                currentValue <= type(uint224).max,
                "new snapshot cannot be casted safely"
            );
            snapshots.push(
                Checkpoint({
                    snapshotId: currentSnapshotId,
                    value: uint224(currentValue)
                })
            );
            return;
        }

        if (snapshots[numSnapshots - 1].snapshotId < currentSnapshotId) {
            require(
                currentValue <= type(uint224).max,
                "new snapshot cannot be casted safely"
            );
            snapshots.push(
                Checkpoint({
                    snapshotId: currentSnapshotId,
                    value: uint224(currentValue)
                })
            );
            return;
        }
    }

    /**
     * @dev Lookup a value in a list of (sorted) checkpoints.
     */
    function _checkpointsLookup(
        Checkpoint[] storage ckpts,
        uint256 snapshotId
    ) internal view returns (uint256, bool) {
        // This function runs a binary search to look for the last checkpoint taken before `blockNumber`.
        //
        // During the loop, the index of the wanted checkpoint remains in the range [low-1, high).
        // With each iteration, either `low` or `high` is moved towards the middle of the range to maintain the invariant.
        // - If the middle checkpoint is after `blockNumber`, the next iteration looks in [low, mid)
        // - If the middle checkpoint is before or equal to `blockNumber`, the next iteration looks in [mid+1, high)
        // Once it reaches a single value (when low == high), it has found the right checkpoint at the index high-1, if not
        // out of bounds (in which case it's looking too far in the past and the result is 0).
        // Note that if the latest checkpoint available is exactly for `blockNumber`, it will end up with an index that is
        // past the end of the array, so this technically doesn't find a checkpoint after `blockNumber`, but the result is
        // the same.
        uint256 ckptsLength = ckpts.length;
        if (ckptsLength == 0) return (0, false);
        Checkpoint memory lastCkpt = ckpts[ckptsLength - 1];
        uint224 lastCkptSnapId = lastCkpt.snapshotId;
        if (snapshotId == lastCkptSnapId) return (lastCkpt.value, true);
        if (snapshotId > lastCkptSnapId) return (0, false);

        uint256 high = ckptsLength;
        uint256 low = 0;

        while (low < high) {
            uint256 mid = low + ((high - low) >> 1);
            if (ckpts[mid].snapshotId > snapshotId) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        return high == 0 ? (0, true) : (ckpts[high - 1].value, true);
    }
}
