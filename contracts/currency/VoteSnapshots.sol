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
abstract contract VoteSnapshots is ERC20Delegated {
    // structure for saving past voting balances, accounting for delegation
    struct Snapshot {
        uint32 snapshotId;
        uint224 value;
    }

    uint32 public currentSnapshotId;

    // mapping to the ordered arrays of voting snapshots for each address
    mapping(address => Snapshot[]) public snapshots;

    mapping(address => Snapshot) public latestSnapshot;

    // the snapshots to track the token total supply
    Snapshot[] private _totalSupplySnapshots;

    /**
     * @dev Emitted by {_snapshot} when a snapshot identified by `id` is created.
     */
    event NewSnapshotId(uint256 id);

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
     * @dev Get number of snapshots for `account`.
     */
    function numSnapshots(
        address account
    ) public view virtual returns (uint256) {
        return snapshots[account].length;
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
        (uint256 value, bool snapshotted) = _snapshotLookup(
            snapshots[account],
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
        (uint256 value, bool snapshotted) = _snapshotLookup(
            _totalSupplySnapshots,
            snapshotId
        );
        return snapshotted ? value : _totalSupply;
    }

    /**
     * @dev Creates a new snapshot and returns its snapshot id.
     *
     * Emits a {NewSnapshotId} event that contains the same id.
     */
    function _snapshot() internal virtual returns (uint256) {
        // the math will error if the snapshot overflows
        uint32 newId = ++currentSnapshotId;

        emit NewSnapshotId(newId);
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
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        if (from != address(0) && voter[from]) {
            _updateAccountSnapshot(from);
        }
        if (to != address(0) && voter[to]) {
            _updateAccountSnapshot(to);
        }
    }

    function _updateAccountSnapshot(address account) private {
        Snapshot storage snapshot = latestSnapshot[account];
        uint256 currentValue = _voteBalances[account];

        if (snapshot.snapshotId < currentSnapshotId) {
            // a snapshot is done in the constructor/initializer, so this means the address is uninitialized
            require(
                currentValue <= type(uint224).max,
                "new snapshot cannot be casted safely"
            );

            snapshot.snapshotId = currentSnapshotId;
            snapshot.value = uint224(currentValue);

            snapshots[account].push(snapshot);
        }
    }

    function _updateTotalSupplySnapshot() private {
        uint256 numSnapshots = _totalSupplySnapshots.length;
        uint256 currentValue = _totalSupply;

        if (
            numSnapshots == 0 ||
            _totalSupplySnapshots[numSnapshots - 1].snapshotId <
            currentSnapshotId
        ) {
            require(
                currentValue <= type(uint224).max,
                "new snapshot cannot be casted safely"
            );
            _totalSupplySnapshots.push(
                Snapshot({
                    snapshotId: currentSnapshotId,
                    value: uint224(currentValue)
                })
            );
        }
    }

    /**
     * @dev Lookup a value in a list of (sorted) snapshots.
     */
    function _snapshotLookup(
        Snapshot[] storage ckpts,
        uint256 snapshotId
    ) internal view returns (uint256, bool) {
        // This function runs a binary search to look for the last snapshot taken before `blockNumber`.
        //
        // During the loop, the index of the wanted snapshot remains in the range [low-1, high).
        // With each iteration, either `low` or `high` is moved towards the middle of the range to maintain the invariant.
        // - If the middle snapshot is after `blockNumber`, the next iteration looks in [low, mid)
        // - If the middle snapshot is before or equal to `blockNumber`, the next iteration looks in [mid+1, high)
        // Once it reaches a single value (when low == high), it has found the right snapshot at the index high-1, if not
        // out of bounds (in which case it's looking too far in the past and the result is 0).
        // Note that if the latest snapshot available is exactly for `blockNumber`, it will end up with an index that is
        // past the end of the array, so this technically doesn't find a snapshot after `blockNumber`, but the result is
        // the same.
        uint256 ckptsLength = ckpts.length;
        if (ckptsLength == 0) return (0, false);
        Snapshot memory lastCkpt = ckpts[ckptsLength - 1];
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
