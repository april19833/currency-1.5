/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./InflationCheckpoints.sol";
import "../governance/monetary/CurrencyGovernance.sol";

/** @title An ERC20 token interface to the Eco currency system.
 */
contract ECO is InflationCheckpoints {
    uint256 public inflationMultiplier;

    /** Fired when a proposal with a new inflation multiplier is selected and passed.
     * Used to calculate new values for the rebased token.
     */
    event NewInflationMultiplier(uint256 inflationMultiplier);

    // the address of the contract for initial distribution
    address public immutable distributor;

    uint256 public immutable initialSupply;

    /**
     * @dev Mapping storing contracts able to mint tokens
     */
    mapping(address => bool) public minters;
    /**
     * @dev Mapping storing contracts able to burn tokens
     */
    mapping(address => bool) public burners;
    /**
     * @dev Mapping storing contracts able to rebase the token
     */
    mapping(address => bool) public rebasers;
    /**
     * @dev Mapping storing contracts able to rebase the token
     */
    mapping(address => bool) public snapshotters;

    // placeholder test vars
    bool public rebased;
    bool public snapshotted;

    // error for when an address tries to mint tokens without permission
    error OnlyMinters();

    // error for when an address tries to burn tokens without permission
    error OnlyBurners();

    // error for when an address tries to rebase without permission
    error OnlyRebasers();

    // error for when an address tries to rebase without permission
    error OnlySnapshotters();

    /**
     * @dev Modifier for checking if the sender is a minter
     */
    modifier onlyMinterRole() {
        if(!minters[msg.sender]) {
            revert OnlyMinters();
        }
        _;
    }

    /**
     * @dev Modifier for checking if the sender is allowed to burn
     * both burners and the message sender can burn
     * @param _from the address burning tokens
     */
    modifier onlyBurnerRoleOrSelf(address _from) {
        if(_from != msg.sender && !burners[msg.sender]) {
            revert OnlyBurners();
        }
        _;
    }

    /**
     * @dev Modifier for checking if the sender is a rebaser
     */
    modifier onlyRebaserRole() {
        if(!rebasers[msg.sender]) {
            revert OnlyRebasers();
        }
        _;
    }

    /**
     * @dev Modifier for checking if the sender is a rebaser
     */
    modifier onlySnapshotterRole() {
        if(!snapshotters[msg.sender]) {
            revert OnlySnapshotters();
        }
        _;
    }

    constructor(
        Policy _policy,
        address _distributor,
        uint256 _initialSupply,
        address _initialPauser
    ) InflationCheckpoints(_policy, "ECO", "ECO", _initialPauser) {
        distributor = _distributor;
        initialSupply = _initialSupply;
    }

    function initialize(
        address _self
    ) public virtual override onlyConstruction {
        super.initialize(_self);
        pauser = ERC20Pausable(_self).pauser();
        _mint(distributor, initialSupply);
    }

    function mint(address _to, uint256 _value) external onlyMinterRole {
        _mint(_to, _value);
    }

    function burn(address _from, uint256 _value) external onlyBurnerRoleOrSelf(_from) {
        _burn(_from, _value);
    }

    function rebase(uint256 _inflationMultiplier) public onlyRebaserRole {
        rebased = true;
    }

    function snapshot() public onlySnapshotterRole {
        snapshotted = true;
    }

    /**
     * @dev change the minting permissions for an address
     * only callable by tokenRoleAdmin
     * @param _key the address to change permissions for
     * @param _value the new permission. true = can mint, false = cannot mint
     */
    function updateMinters(address _key, bool _value)
        public
        onlyPolicy
    {
        minters[_key] = _value;
    }

    /**
     * @dev change the burning permissions for an address
     * only callable by tokenRoleAdmin
     * @param _key the address to change permissions for
     * @param _value the new permission. true = can burn, false = cannot burn
     */
    function updateBurners(address _key, bool _value)
        public
        onlyPolicy
    {
        burners[_key] = _value;
    }

    /**
     * @dev change the rebasing permissions for an address
     * only callable by tokenRoleAdmin
     * @param _key the address to change permissions for
     * @param _value the new permission. true = can rebase, false = cannot rebase
     */
    function updateRebasers(address _key, bool _value)
        public
        onlyPolicy
    {
        rebasers[_key] = _value;
    }

    /**
     * @dev change the rebasing permissions for an address
     * only callable by tokenRoleAdmin
     * @param _key the address to change permissions for
     * @param _value the new permission. true = can snapshot, false = cannot snapshot
     */
    function updateSnapshotters(address _key, bool _value)
        public
        onlyPolicy
    {
        snapshotters[_key] = _value;
    }

    function getInflationMultiplier()
        public
        returns (uint256 _inflationMultiplier)
    {
        return inflationMultiplier;
    }
}
