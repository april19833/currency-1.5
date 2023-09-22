// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./IECO.sol";
import "../policy/Policed.sol";
import "./ECOx.sol";

contract ECOxExchange is Policed {
    /**
     * @dev address of ECOx token contract
     */
    address public ECOx;

    /**
     * @dev address of ECO token contract
     */
    address public eco;

    /**
     * emits when the ECOx address is changed
     * @param _old old holder of role
     * @param _new new holder of role
     */
    event UpdatedECOx(address _old, address _new);

    /**
     * emits when the ECO address is changed
     * @param _old old holder of role
     * @param _new new holder of role
     */
    event UpdatedEco(address _old, address _new);

    constructor(Policy policy, address _ECOx, IECO _eco) Policed(policy) {
        ECOx = _ECOx;
        eco = address(_eco);
    }

    /**
     * @dev change the ECOx address
     * @param _newRoleHolder the new ECOxExchange address
     */
    function updateECOx(address _newRoleHolder) public onlyPolicy {
        emit UpdatedECOx(ECOx, _newRoleHolder);
        ECOx = _newRoleHolder;
    }

    /**
     * @dev change the ECO address
     * @param _newRoleHolder the new ECO address
     */
    function updateEco(address _newRoleHolder) public onlyPolicy {
        emit UpdatedEco(eco, _newRoleHolder);
        eco = _newRoleHolder;
    }
}
