// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20MintAndBurn.sol";

/**
 * @dev Basic snapshotting just for total supply.
 *
 * This extension maintains a snapshot the total supply which updates on mint or burn after a new snapshot is taken.
 */
abstract contract TotalSupplySnapshots is ERC20MintAndBurn {
    // structure for saving snapshotted values
    struct Snapshot {
        uint32 snapshotBlock;
        uint224 value;
    }

    // the reference snapshotBlock that the update function checks against
    uint32 public currentSnapshotBlock;

    // the snapshot to track the token total supply
    Snapshot private _totalSupplySnapshot;

    /**
     * @dev Emitted by {_snapshot} when a new snapshot is created.
     *
     * @param block the new value of currentSnapshotBlock
     */
    event NewSnapshotBlock(uint256 block);

    constructor(
        Policy _policy,
        string memory _name,
        string memory _symbol,
        address _initialPauser
    ) ERC20MintAndBurn(_policy, _name, _symbol, _initialPauser) {
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
     * @dev Retrieve the `totalSupply` for the snapshot
     */
    function totalSupplySnapshot() public view virtual returns (uint256) {
        if (
            // currentSnapshotBlock != block.number && // this line fucks up the current abliity to snapshot total power, but might need implemented
            _totalSupplySnapshot.snapshotBlock < currentSnapshotBlock
        ) {
            return _totalSupply;
        } else {
            return _totalSupplySnapshot.value;
        }
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
     * @dev Creates a new snapshot and returns its snapshot id.
     *
     * Emits a {NewSnapshotBlock} event that contains the same id.
     */
    function _snapshot() internal virtual {
        // the math will error if the snapshot overflows
        currentSnapshotBlock = uint32(block.number);

        emit NewSnapshotBlock(block.number);
    }

    function _updateTotalSupplySnapshot() private {
        // take no action during the snapshot block, only after it
        uint32 _currentSnapshotBlock = currentSnapshotBlock;
        if (_currentSnapshotBlock == block.number) {
            return;
        }

        if (_totalSupplySnapshot.snapshotBlock < _currentSnapshotBlock) {
            uint256 currentValue = _totalSupply;
            require(
                currentValue <= type(uint224).max,
                "VoteSnapshots: new snapshot cannot be casted safely"
            );
            _totalSupplySnapshot.snapshotBlock = _currentSnapshotBlock;
            _totalSupplySnapshot.value = uint224(currentValue);
        }
    }

    // protecting future upgradeability
    uint256[50] private __gapTotalSupplySnapshots;
}