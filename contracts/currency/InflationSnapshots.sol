/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./VoteSnapshots.sol";

/** @title InflationSnapshots
 * This implements a generational store with snapshotted balances. Balances
 * are lazy-evaluated, but are effectively all atomically snapshotted when
 * the generation changes.
 */
abstract contract InflationSnapshots is VoteSnapshots {
    uint256 public constant INITIAL_INFLATION_MULTIPLIER = 1e18;

    Snapshot[] internal inflationMultiplierSnapshots;

    uint256 internal inflationMultiplier;

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

    function getInflationMultiplier() public view returns (uint256) {
        return inflationMultiplier;
    }

    function getInflationMultiplierAt(
        uint256 snapshotId
    ) public view returns (uint256) {
        // (bool snapshotted, uint256 value) = _valueAt(
        //     snapshotId,
        //     inflationMultiplierSnapshots
        // );

        // return snapshotted ? value : inflationMultiplier;
        (uint256 value, bool snapshotted) = _snapshotLookup(
            inflationMultiplierSnapshots,
            snapshotId
        );
        return snapshotted ? value : inflationMultiplier;
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

    /** Returns the total (inflation corrected) token supply at a specified block number
     */
    function totalSupplyAt(
        uint256 snapshotId
    ) public view override returns (uint256) {
        uint256 _inflationMultiplier = getInflationMultiplierAt(snapshotId);

        return super.totalSupplyAt(snapshotId) / _inflationMultiplier;
    }

    /** Return historical voting balance (includes delegation) at given block number.
     *
     * If the latest block number for the account is before the requested
     * block then the most recent known balance is returned. Otherwise the
     * exact block number requested is returned.
     *
     * @param owner The account to check the balance of.
     * @param snapshotId The block number to check the balance at the start
     *                        of. Must be less than or equal to the present
     *                        block number.
     */
    function voteBalanceOfAt(
        address owner,
        uint256 snapshotId
    ) public view override returns (uint256) {
        uint256 _inflationMultiplier = getInflationMultiplierAt(snapshotId);

        if(_inflationMultiplier == 0) {
            return 0;
        }

        return super.voteBalanceOfAt(owner, snapshotId) / _inflationMultiplier;
    }

    function _updateInflationSnapshot() internal {
        uint256 numSnapshots = inflationMultiplierSnapshots.length;
        uint256 currentValue = inflationMultiplier;

        if (
            numSnapshots == 0 ||
            inflationMultiplierSnapshots[numSnapshots - 1].snapshotId <
            currentSnapshotId
        ) {
            require(
                currentValue <= type(uint224).max,
                "new snapshot cannot be casted safely"
            );
            inflationMultiplierSnapshots.push(
                Snapshot({
                    snapshotId: currentSnapshotId,
                    value: uint224(currentValue)
                })
            );
        }
    }
}