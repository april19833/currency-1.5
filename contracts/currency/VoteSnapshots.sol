// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20Delegated.sol";

/**
 * Extension of ERC20Delegated to support snapshotting.
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

    /// the reference snapshotBlock that the update function checks against
    uint32 public currentSnapshotBlock;

    /// mapping of each address to it's latest snapshot of votes
    mapping(address => Snapshot) private _voteSnapshots;

    /// the snapshot to track the token total supply
    Snapshot private _totalSupplySnapshot;

    /**
     * Emitted by {_snapshot} when a new snapshot is created.
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
     * Retrieve the balance for the snapshot
     *
     * @param account the address to check vote balances for
     * @return balance the balance for the snapshot
     */
    function voteBalanceSnapshot(
        address account
    ) public view virtual returns (uint256 balance) {
        Snapshot memory _accountSnapshot = _voteSnapshots[account];

        if (_accountSnapshot.snapshotBlock < currentSnapshotBlock) {
            balance = _voteBalances[account];
        } else {
            balance = _accountSnapshot.value;
        }
        return balance;
    }

    /**
     * Retrieve the `totalSupply` for the snapshot
     * @return totalSupply total supply for the current Snapshot
     */
    function totalSupplySnapshot()
        public
        view
        virtual
        returns (uint256 totalSupply)
    {
        if (_totalSupplySnapshot.snapshotBlock < currentSnapshotBlock) {
            totalSupply = _totalSupply;
        } else {
            totalSupply = _totalSupplySnapshot.value;
        }
        return totalSupply;
    }

    /**
     * Creates a new snapshot and returns its snapshot id.
     *
     * Emits a {NewSnapshotBlock} event that contains the same id.
     * @return snapshotId new snapshot idenitifier
     */
    function _snapshot() internal virtual returns (uint256 snapshotId) {
        // the math will error if the snapshot overflows
        currentSnapshotBlock = uint32(block.number);

        emit NewSnapshotBlock(block.number);
        snapshotId = block.number;
        return snapshotId;
    }

    /**
     * Update total supply snapshots before the values are modified. This is implemented
     * in the _beforeTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.
     * @param from the from address for the transfer
     * @param to the to address for the transfer
     * @param amount the amount of the transfer
     * @return totalSupplyAmount the totalSupply ammount before the token transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override returns (uint256 totalSupplyAmount) {
        if (from == address(0)) {
            // mint
            _updateTotalSupplySnapshot();
        } else if (to == address(0)) {
            // burn
            _updateTotalSupplySnapshot();
        }

        totalSupplyAmount = super._beforeTokenTransfer(from, to, amount);
        return totalSupplyAmount;
    }

    /**
     * Update balance snapshots for votes before the values are modified. This is implemented
     * in the _beforeVoteTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.
     * @param from the from address for the transfer
     * @param to the to address for the transfer
     * @param amount the amount of the transfer
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
        Snapshot storage snapshot = _voteSnapshots[account];
        uint256 currentValue = _voteBalances[account];

        if (snapshot.snapshotBlock < currentSnapshotBlock) {
            require(
                currentValue <= type(uint224).max,
                "VoteSnapshots: new snapshot cannot be casted safely"
            );

            snapshot.snapshotBlock = currentSnapshotBlock;
            snapshot.value = uint224(currentValue);
        }
    }

    function _updateTotalSupplySnapshot() private {
        if (_totalSupplySnapshot.snapshotBlock < currentSnapshotBlock) {
            uint256 currentValue = _totalSupply;
            require(
                currentValue <= type(uint224).max,
                "VoteSnapshots: new snapshot cannot be casted safely"
            );
            _totalSupplySnapshot.snapshotBlock = currentSnapshotBlock;
            _totalSupplySnapshot.value = uint224(currentValue);
        }
    }
}
