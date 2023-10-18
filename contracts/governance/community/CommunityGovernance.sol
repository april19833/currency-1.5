// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "../../policy/Policed.sol";
import "../../currency/ECO.sol";
import "./ECOxStaking.sol";

contract CommunityGovernance is Policed, Pausable, TimeUtils {
    //////////////////////////////////////////////
    /////////////////// TYPES ////////////////////
    //////////////////////////////////////////////

    //////////////////////////////////////////////
    //////////////////// VARS ////////////////////
    //////////////////////////////////////////////

    /** ECO contract */
    ECO public immutable eco;

    /** ECOxStaking contract */
    ECOxStaking public immutable ecoXStaking;

    /** address allowed to pause community governance */
    address public pauser;

    //////////////////////////////////////////////
    /////////////////// ERRORS ///////////////////
    //////////////////////////////////////////////

    /**
     * error for when non-pauser tries to call methods without permission
     */
    error OnlyPauser();

    /**
     * error for when setPauser is called with the existing pauser address as an argument
     */
    error SamePauser();
    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

    /**
     * @notice event indicating the pauser was updated
     * @param pauser The new pauser
     */
    event PauserAssignment(address indexed pauser);

    modifier onlyPauser() {
        require(msg.sender == pauser, "ERC20Pausable: not pauser");
        _;
    }

    constructor(
        Policy policy,
        address _eco,
        address _ecoXStaking,
        address _pauser
    ) Policed(policy) {
        eco = ECO(_eco);
        ecoXStaking = ECOxStaking(_ecoXStaking);
        pauser = _pauser;
    }

    function setPauser(address _pauser) public onlyPolicy {
        if (pauser == _pauser) {
            revert SamePauser();
        }
        pauser = _pauser;
        emit PauserAssignment(_pauser);
    }
}
