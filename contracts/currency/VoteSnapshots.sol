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
    // mapping of each address to it's latest snapshot of votes
    mapping(address => Snapshot) private _voteSnapshots;

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
        // call to super constructor
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

        if (
            currentSnapshotBlock != block.number &&
            _accountSnapshot.snapshotBlock < currentSnapshotBlock
        ) {
            return _voteBalances[account];
        } else {
            return _accountSnapshot.value;
        }
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
        super._beforeVoteTokenTransfer(from, to, amount);

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
        if (_currentSnapshotBlock == block.number) {
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

    // protecting future upgradeability
    uint256[50] private __gapVoteSnapshots;
}
