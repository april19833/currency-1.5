/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../policy/PolicedUpgradeable.sol";
import "./ERC20Pausable.sol";

/** @title An ERC20 token interface for ECOx
 *
 */
contract ERC20MintAndBurn is ERC20Pausable, PolicedUpgradeable {
    // storage gap covers all of ECO contract's old delegation functionality (no ECOx storage to be gapped)
    uint256[10] private __gapMintAndBurn;
    // additional useable gap for future upgradeability
    uint256[50] private __gapMintAndBurn2;
    //////////////////////////////////////////////
    //////////////////// VARS ////////////////////
    //////////////////////////////////////////////
    /**
     * @dev Mapping storing contracts able to mint tokens
     */
    mapping(address => bool) public minters;

    /**
     * @dev Mapping storing contracts able to burn tokens
     */
    mapping(address => bool) public burners;

    //////////////////////////////////////////////
    /////////////////// ERRORS ///////////////////
    //////////////////////////////////////////////

    /**
     * @dev error for when an address tries to mint tokens without permission
     */
    error OnlyMinters();

    /**
     * @dev error for when an address tries to burn tokens without permission
     */
    error OnlyBurners();

    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

    /**
     * emits when the minters permissions are changed
     * @param actor denotes the new address whose permissions are being updated
     * @param newPermission denotes the new ability of the actor address (true for can mint, false for cannot)
     */
    event UpdatedMinters(address actor, bool newPermission);

    /**
     * emits when the burners permissions are changed
     * @param actor denotes the new address whose permissions are being updated
     * @param newPermission denotes the new ability of the actor address (true for can burn, false for cannot)
     */
    event UpdatedBurners(address actor, bool newPermission);

    //////////////////////////////////////////////
    ////////////////// MODIFIERS /////////////////
    //////////////////////////////////////////////

    /**
     * @dev Modifier for checking if the sender is a minter
     */
    modifier onlyMinterRole() {
        if (!minters[msg.sender]) {
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
        if (_from != msg.sender && !burners[msg.sender]) {
            revert OnlyBurners();
        }
        _;
    }

    constructor(
        Policy policy,
        string memory name,
        string memory ticker,
        address pauser
    ) Policed(policy) ERC20Pausable(name, ticker, address(policy), pauser) {}

    /**
     * @dev change the minting permissions for an address
     * only callable by tokenRoleAdmin
     * @param _key the address to change permissions for
     * @param _value the new permission. true = can mint, false = cannot mint
     */
    function updateMinters(address _key, bool _value) public onlyPolicy {
        minters[_key] = _value;
        emit UpdatedMinters(_key, _value);
    }

    /**
     * @dev change the burning permissions for an address
     * only callable by tokenRoleAdmin
     * @param _key the address to change permissions for
     * @param _value the new permission. true = can burn, false = cannot burn
     */
    function updateBurners(address _key, bool _value) public onlyPolicy {
        burners[_key] = _value;
        emit UpdatedBurners(_key, _value);
    }

    /**
     * @dev mints tokens to a given address
     * @param _to the address receiving tokens
     * @param _value the amount of tokens being minted
     */
    function mint(address _to, uint256 _value) external onlyMinterRole {
        _mint(_to, _value);
    }

    /**
     * @dev burns tokens to a given address
     * @param _from the address whose tokens are being burned
     * @param _value the amount of tokens being burned
     */
    function burn(
        address _from,
        uint256 _value
    ) external onlyBurnerRoleOrSelf(_from) {
        _burn(_from, _value);
    }

    // protecting future upgradeability
    uint256[50] private __gapMintAndBurn3;
}
