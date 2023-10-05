/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./IECO.sol";
import "../policy/Policed.sol";
import "./ERC20Pausable.sol";

/** @title An ERC20 token interface for ECOx
 *
 */
contract ECOx is ERC20Pausable, Policed {
    //////////////////////////////////////////////
    //////////////////// VARS ////////////////////
    //////////////////////////////////////////////

    /**
     * @dev address of ECOxStaking contract
     */
    address public ecoXStaking;

    /**
     * @dev address of ECOxExchange contract
     */
    address public ecoXExchange;

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

    /**
     * @dev error for when transfer returns false
     * used by contracts that import this contract
     */
    error TransferFailed();

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

    /**
     * emits when the ECOxStaking address is changed
     * @param _old old holder of role
     * @param _new new holder of role
     */
    event UpdatedECOxStaking(address _old, address _new);

    /**
     * emits when the ECOxExchange address is changed
     * @param _old old holder of role
     * @param _new new holder of role
     */
    event UpdatedECOxExchange(address _old, address _new);

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
        Policy _policy,
        address _ecoXStaking,
        address _ecoXExchange,
        address _pauser
    )
        ERC20Pausable("ECOx", "ECOx", address(_policy), _pauser)
        Policed(_policy)
    {
        ecoXStaking = _ecoXStaking;
        ecoXExchange = _ecoXExchange;
    }

    /**
     * unlikely this will need to be used again since the proxy has already been initialized.
     */
    function initialize(
        address _self
    ) public virtual override onlyConstruction {
        super.initialize(_self);

        policy = Policed(_self).policy();
        ecoXStaking = ECOx(_self).ecoXStaking();
        ecoXExchange = ECOx(_self).ecoXExchange();
    }

    /**
     * @dev change the ECOxStaking address
     * @param _newRoleHolder the new ECOxStaking address
     */
    function updateECOxStaking(address _newRoleHolder) public onlyPolicy {
        emit UpdatedECOxStaking(ecoXExchange, _newRoleHolder);
        ecoXStaking = _newRoleHolder;
    }

    /**
     * @dev change the ECOxExchange address
     * @param _newRoleHolder the new ECOxExchange address
     */
    function updateECOxExchange(address _newRoleHolder) public onlyPolicy {
        emit UpdatedECOxExchange(ecoXExchange, _newRoleHolder);
        ecoXExchange = _newRoleHolder;
    }

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
}
