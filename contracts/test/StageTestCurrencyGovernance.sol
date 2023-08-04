// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/monetary/CurrencyGovernance.sol";

/** @title StageTestCurrencyGovernance
 * For minimally testing the stage modifiers in currency governance
 */
contract StageTestCurrencyGovernance is CurrencyGovernance {

    constructor() CurrencyGovernance(Policy(address(0x11)), TrustedNodes(address(0x12)), address(0x13)) {}

    function inProposePhase(uint256 _cycle) public duringProposePhase(_cycle) returns (bool) {
        return true;
    }

    function inVotePhase(uint256 _cycle) public duringVotePhase(_cycle) returns (bool) {
        return true;
    }

    function inRevealPhase(uint256 _cycle) public duringRevealPhase(_cycle) returns (bool) {
        return true;
    }

    function cycleCompleted(uint256 _cycle) public cycleComplete(_cycle) returns (bool) {
        return true;
    }
}