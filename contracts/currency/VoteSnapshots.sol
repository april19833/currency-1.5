// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20Delegated.sol";

/**
 * @dev Extension of ERC20Delegated to support snapshotting.
 *
 * This extension maintains a snapshot of each addresses's votes which updates on the transfer after a new snapshot is taken.
 * Only addresses that have opted into voting are snapshotted.
 */
abstract contract VoteSnapshots is ERC20Delegated {
    // structure for saving snapshotted values
    struct Snapshot {
        uint32 snapshotId;
        uint224 value;
    }

    // the reference snapshotId that the update function checks against
    uint32 public currentSnapshotId;

    // mapping to the ordered arrays of voting snapshots for each address
    mapping(address => Snapshot[]) public snapshots;

    mapping(address => Snapshot) public latestSnapshot;

    // the snapshot to track the token total supply
    Snapshot[] private _totalSupplySnapshot;

    /**
     * @dev Emitted by {_snapshot} when a new snapshot is created.
     *
     * @param id the new value of currentSnapshotId
     */
    event NewSnapshotId(uint256 id);

    /** Construct a new instance.
     *
     * the root _policy needs to be passed down through to service ERC20BurnAndMint
     */
    constructor(
        Policy _policy,
        string memory _name,
        string memory _symbol,
        address _initialPauser
    ) ERC20Delegated(_policy, _name, _symbol, _initialPauser) {
        // snapshot on creation to make it clear that everyone's balances should be updated
        _snapshot();
    }

    function initialize(
        address _self
    ) public virtual override onlyConstruction {
        super.initialize(_self);
        // snapshot on initialization to make it clear that everyone's balances should be updated after upgrade
        _snapshot();
    }

    /**
     * TODO: new function
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
     * @dev Retrieve the `totalSupply` for the snapshot
     */
    function totalSupplyAt(
        uint256 snapshotId
    ) public view virtual returns (uint256) {
        require(snapshotId <= currentSnapshotId, "must be past snapshot");
        (uint256 value, bool snapshotted) = _snapshotLookup(
            _totalSupplySnapshot,
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

    /** 
     * Update total supply snapshots before the values are modified. This is implemented
     * in the _beforeTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.
     */
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

    /** 
     * Update balance snapshots for votes before the values are modified. This is implemented
     * in the _beforeVoteTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.
     */
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
        uint256 numSnapshots = _totalSupplySnapshot.length;
        uint256 currentValue = _totalSupply;

        if (
            numSnapshots == 0 ||
            _totalSupplySnapshot[numSnapshots - 1].snapshotId <
            currentSnapshotId
        ) {
            require(
                currentValue <= type(uint224).max,
                "new snapshot cannot be casted safely"
            );
            _totalSupplySnapshot.push(
                Snapshot({
                    snapshotId: currentSnapshotId,
                    value: uint224(currentValue)
                })
            );
        }
    }

    /**
     * @dev likely this is gone after
     */
    function _snapshotLookup(
        Snapshot[] storage ckpts,
        uint256 snapshotId
    ) internal view returns (uint256, bool) {
        // TODO: Edit comment
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
