/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./VoteSnapshots.sol";

/** @title InflationSnapshots
 * This implements a scaling inflation multiplier on all balances and votes.
 * Changing this value (via implementing _rebase)
 */
abstract contract InflationSnapshots is VoteSnapshots {
    uint256 public constant INITIAL_INFLATION_MULTIPLIER = 1e18;

    Snapshot internal _inflationMultiplierSnapshot;

    uint256 public inflationMultiplier;

    /**
     * error for when a rebase attempts to rebase incorrectly
     */
    error BadRebaseValue();

    /** Fired when a proposal with a new inflation multiplier is selected and passed.
     * Used to calculate new values for the rebased token.
     * @param adjustinginflationMultiplier the multiplier that has just been applied to the tokens
     * @param cumulativeInflationMultiplier the total multiplier that is used to convert to and from gons
     */
    event NewInflationMultiplier(
        uint256 adjustinginflationMultiplier,
        uint256 cumulativeInflationMultiplier
    );

    // to be used to record the transfer amounts after _beforeTokenTransfer
    // these values are the base (unchanging) values the currency is stored in
    event BaseValueTransfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

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
    ) VoteSnapshots(_policy, _name, _symbol, _initialPauser) {
        inflationMultiplier = INITIAL_INFLATION_MULTIPLIER;
        _updateInflationSnapshot();
    }

    function initialize(
        address _self
    ) public virtual override onlyConstruction {
        super.initialize(_self);
        inflationMultiplier = INITIAL_INFLATION_MULTIPLIER;
        _updateInflationSnapshot();
    }

    function _rebase(uint256 _inflationMultiplier) internal virtual {
        if (_inflationMultiplier == 0) {
            revert BadRebaseValue();
        }

        // update snapshot with old value
        _updateInflationSnapshot();

        uint256 newInflationMult = (_inflationMultiplier *
            inflationMultiplier) / INITIAL_INFLATION_MULTIPLIER;

        inflationMultiplier = newInflationMult;

        emit NewInflationMultiplier(_inflationMultiplier, newInflationMult);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override returns (uint256) {
        amount = super._beforeTokenTransfer(from, to, amount);
        uint256 gonsAmount = amount * inflationMultiplier;

        emit BaseValueTransfer(from, to, gonsAmount);

        return gonsAmount;
    }

    function inflationMultiplierSnapshot() public view returns (uint256) {
        if (_inflationMultiplierSnapshot.snapshotId < currentSnapshotId) {
            return inflationMultiplier;
        } else {
            return _inflationMultiplierSnapshot.value;
        }
    }

    /** Access function to determine the token balance held by some address.
     */
    function balanceOf(address _owner) public view override returns (uint256) {
        return _balances[_owner] / inflationMultiplier;
    }

    /** Access function to determine the voting balance (includes delegation) of some address.
     */
    function voteBalanceOf(
        address _owner
    ) public view override returns (uint256) {
        return _voteBalances[_owner] / inflationMultiplier;
    }

    /** Returns the total (inflation corrected) token supply
     */
    function totalSupply() public view override returns (uint256) {
        return _totalSupply / inflationMultiplier;
    }

    /** Returns the total (inflation corrected) token supply for the current snapshot
     */
    function totalSupplySnapshot() public view override returns (uint256) {
        return super.totalSupplySnapshot() / inflationMultiplierSnapshot();
    }

    /** Return snapshotted voting balance (includes delegation) for the current snapshot.
     *
     * @param account The account to check the votes of.
     */
    function voteBalanceSnapshot(
        address account
    ) public view override returns (uint256) {
        uint256 _inflationMultiplier = inflationMultiplierSnapshot();

        if (_inflationMultiplier == 0) {
            return 0;
        }

        return super.voteBalanceSnapshot(account) / _inflationMultiplier;
    }

    function _updateInflationSnapshot() private {
        if (
            _inflationMultiplierSnapshot.snapshotId < currentSnapshotId
        ) {
            uint256 currentValue = inflationMultiplier;
            require(
                currentValue <= type(uint224).max,
                "InflationSnapshots: new snapshot cannot be casted safely"
            );
            _inflationMultiplierSnapshot.snapshotId = currentSnapshotId;
            _inflationMultiplierSnapshot.value = uint224(currentValue);
        }
    }
}