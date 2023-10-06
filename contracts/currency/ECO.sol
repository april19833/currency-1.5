/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./InflationSnapshots.sol";
import "../governance/monetary/CurrencyGovernance.sol";

/** @title An ERC20 token interface to the Eco currency system.
 */
contract ECO is InflationSnapshots {
    //////////////////////////////////////////////
    //////////////////// VARS ////////////////////
    //////////////////////////////////////////////

    /**
     * the address of the contract for initial distribution
     */
    address public immutable distributor;

    /**
     * the initial amount of tokens distributed
     */
    uint256 public immutable initialSupply;

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

    /**
     * error for when a rebase attempts to rebase incorrectly
     */
    error BadRebaseValue();

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

    /** Fired when a proposal with a new inflation multiplier is selected and passed.
     * Used to calculate new values for the rebased token.
     * @param adjustinginflationMultiplier the multiplier that has just been applied to the tokens
     * @param cumulativeInflationMultiplier the total multiplier that is used to convert to and from gons
     */
    event NewInflationMultiplier(
        uint256 adjustinginflationMultiplier,
        uint256 cumulativeInflationMultiplier
    );

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
     * @dev Modifier for checking if the sender is a rebaser
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
        address _distributor,
        uint256 _initialSupply,
        address _initialPauser
    ) InflationSnapshots(_policy, "ECO", "ECO", _initialPauser) {
        distributor = _distributor;
        initialSupply = _initialSupply;
    }

    //////////////////////////////////////////////
    ///////////////// INITIALIZER ////////////////
    //////////////////////////////////////////////

    function initialize(
        address _self
    ) public virtual override onlyConstruction {
        super.initialize(_self);
        pauser = ERC20Pausable(_self).pauser();
        // policy = Policed(_self).policy();
        _mint(distributor, initialSupply);
    }

    //////////////////////////////////////////////
    ////////////////// FUNCTIONS /////////////////
    //////////////////////////////////////////////

    function rebase(uint256 _inflationMultiplier) public onlyRebaserRole {
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
