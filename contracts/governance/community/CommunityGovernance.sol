// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "../../policy/Policed.sol";
import "../../currency/ECO.sol";
import "../../currency/ECOxStaking.sol";


contract CommunityGovernance is Policed, Pausable, TimeUtils{
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

    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

    /**
     * @notice event indicating the pauser was updated
     * @param pauser The new pauser
     */
    event PauserAssignment(address indexed pauser);

    constructor(Policy policy, address _eco, address _ecoXStaking) Policed(policy) {
        eco = ECO(_eco);
        ecoXStaking = ECOxStaking(_ecoXStaking);
        pauser = address(policy);
    }

    function setPauser(address _pauser) public onlyPolicy {
        require(_pauser != pauser, "CommunityGovernance: must change pauser");
        pauser = _pauser;
        emit PauserAssignment(_pauser);
    }
}