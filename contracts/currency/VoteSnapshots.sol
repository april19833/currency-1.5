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
        uint32 snapshotBlock;
        uint224 value;
    }

    // the reference snapshotBlock that the update function checks against
    uint32 public currentSnapshotBlock;

    // mapping of each address to it's latest snapshot of votes
    mapping(address => Snapshot) private _voteSnapshots;

    // the snapshot to track the token total supply
    Snapshot private _totalSupplySnapshot;

    /**
     * @dev Emitted by {_snapshot} when a new snapshot is created.
     *
     * @param block the new value of currentSnapshotBlock
     */
    event NewSnapshotBlock(uint256 block);

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
     * @dev Retrieve the balance for the snapshot
     *
     * @param account the address to check vote balances for
     */
    function voteBalanceSnapshot(
        address account
    ) public view virtual returns (uint256) {
        Snapshot memory _accountSnapshot = _voteSnapshots[account];

        if (currentSnapshotBlock != block.number && _accountSnapshot.snapshotBlock < currentSnapshotBlock) {
            return _voteBalances[account];
        } else {
            return _accountSnapshot.value;
        }
    }

    /**
     * @dev Retrieve the `totalSupply` for the snapshot
     */
    function totalSupplySnapshot() public view virtual returns (uint256) {
        if (currentSnapshotBlock != block.number && _totalSupplySnapshot.snapshotBlock < currentSnapshotBlock) {
            return _totalSupply;
        } else {
            return _totalSupplySnapshot.value;
        }
    }

    /**
     * @dev Creates a new snapshot and returns its snapshot id.
     *
     * Emits a {NewSnapshotBlock} event that contains the same id.
     */
    function _snapshot() internal virtual returns (uint256) {
        // the math will error if the snapshot overflows
        currentSnapshotBlock = uint32(block.number);

        emit NewSnapshotBlock(block.number);
        return block.number;
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
        // take no action during the snapshot block, only after it
        uint32 _currentSnapshotBlock = currentSnapshotBlock;
        if(_currentSnapshotBlock == block.number) {
            return;
        }

        Snapshot storage snapshot = _voteSnapshots[account];
        uint256 currentValue = _voteBalances[account];

        if (snapshot.snapshotBlock < _currentSnapshotBlock) {
            require(
                currentValue <= type(uint224).max,
                "VoteSnapshots: new snapshot cannot be casted safely"
            );

            snapshot.snapshotBlock = _currentSnapshotBlock;
            snapshot.value = uint224(currentValue);
        }
    }

    function _updateTotalSupplySnapshot() private {
        // take no action during the snapshot block, only after it
        uint32 _currentSnapshotBlock = currentSnapshotBlock;    
        if(_currentSnapshotBlock == block.number) {
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
}
