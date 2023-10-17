/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./IECO.sol";
import "../policy/Policed.sol";
import "./ERC20Pausable.sol";
import "./ERC20MintAndBurn.sol";

/** @title An ERC20 token interface for ECOx
 *
 */
contract ECOx is ERC20MintAndBurn {
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
     * @dev bits of precision used in the exponentiation approximation
     */
    // uint8 public constant PRECISION_BITS = 100;

    //////////////////////////////////////////////
    /////////////////// ERRORS ///////////////////
    //////////////////////////////////////////////

    /**
     * @dev error for when transfer returns false
     * used by contracts that import this contract
     */
    error TransferFailed();

    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

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

    constructor(
        Policy _policy,
        address _ecoXStaking,
        address _ecoXExchange,
        address _pauser
    ) ERC20MintAndBurn(_policy, "ECOx", "ECOx", _pauser) {
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

        // policy = Policed(_self).policy();
        pauser = ERC20Pausable(_self).pauser();
        ecoXStaking = ECOx(_self).ecoXStaking();
        ecoXExchange = ECOx(_self).ecoXExchange();
    }

    /**
     * @dev change the ECOxStaking address
     * @param _newRoleHolder the new ECOxStaking address
     */
    function updateECOxStaking(address _newRoleHolder) public onlyPolicy {
        emit UpdatedECOxStaking(ecoXStaking, _newRoleHolder);
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
}
