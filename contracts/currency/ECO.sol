/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./InflationSnapshots.sol";
import "../governance/monetary/CurrencyGovernance.sol";

/**
 * @title An ERC20 token interface to the Eco currency system.
 */
contract ECO is InflationSnapshots {
    //////////////////////////////////////////////
    //////////////////// VARS ////////////////////
    //////////////////////////////////////////////

    /**
     * @dev Mapping storing contracts able to rebase the token
     */
    mapping(address => bool) public rebasers;
    /**
     * @dev Mapping storing contracts able to rebase the token
     */
    mapping(address => bool) public snapshotters;

    //////////////////////////////////////////////
    /////////////////// ERRORS ///////////////////
    //////////////////////////////////////////////

    /**
     * error for when an address tries to rebase without permission
     */
    error OnlyRebasers();

    /**
     * error for when an address tries to snapshot without permission
     */
    error OnlySnapshotters();

    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

    /**
     * emits when the rebasers permissions are changed
     * @param actor denotes the new address whose permissions are being updated
     * @param newPermission denotes the new ability of the actor address (true for can rebase, false for cannot)
     */
    event UpdatedRebasers(address actor, bool newPermission);

    /**
     * emits when the snapshotters permissions are changed
     * @param actor denotes the new address whose permissions are being updated
     * @param newPermission denotes the new ability of the actor address (true for can snapshot, false for cannot)
     */
    event UpdatedSnapshotters(address actor, bool newPermission);

    //////////////////////////////////////////////
    ////////////////// MODIFIERS /////////////////
    //////////////////////////////////////////////

    /**
     * @dev Modifier for checking if the sender is a rebaser
     */
    modifier onlyRebaserRole() {
        if (!rebasers[msg.sender]) {
            revert OnlyRebasers();
        }
        _;
    }

    /**
     * @dev Modifier for checking if the sender is a snapshotter
     */
    modifier onlySnapshotterRole() {
        if (!snapshotters[msg.sender]) {
            revert OnlySnapshotters();
        }
        _;
    }

    //////////////////////////////////////////////
    ///////////////// CONSTRUCTOR ////////////////
    //////////////////////////////////////////////

    constructor(
        Policy _policy,
        address _initialPauser
    ) InflationSnapshots(_policy, "ECO", "ECO", _initialPauser) {}

    //////////////////////////////////////////////
    ///////////////// INITIALIZER ////////////////
    //////////////////////////////////////////////

    function initialize(
        address _self
    ) public virtual override onlyConstruction {
        super.initialize(_self);
        pauser = ERC20Pausable(_self).pauser();
    }

    //////////////////////////////////////////////
    ////////////////// FUNCTIONS /////////////////
    //////////////////////////////////////////////

    function rebase(uint256 _inflationMultiplier) public onlyRebaserRole {
        _rebase(_inflationMultiplier);
    }

    function snapshot() public onlySnapshotterRole {
        _snapshot();
    }

    /**
     * @dev change the rebasing permissions for an address
     * only callable by tokenRoleAdmin
     * @param _key the address to change permissions for
     * @param _value the new permission. true = can rebase, false = cannot rebase
     */
    function updateRebasers(address _key, bool _value) public onlyPolicy {
        rebasers[_key] = _value;
        emit UpdatedRebasers(_key, _value);
    }

    /**
     * @dev change the rebasing permissions for an address
     * only callable by tokenRoleAdmin
     * @param _key the address to change permissions for
     * @param _value the new permission. true = can snapshot, false = cannot snapshot
     */
    function updateSnapshotters(address _key, bool _value) public onlyPolicy {
        snapshotters[_key] = _value;
        emit UpdatedSnapshotters(_key, _value);
    }
}
