// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/community/proposals/Proposal.sol";
import "../policy/Policy.sol";
import "../policy/Policed.sol";

/** @title SampleProposal
 *
 * A proposal used for testing proposal adoption.
 */
contract SampleProposal is Policy, Policed, Proposal {
    /** State variable to test
     */
    uint256 public counter;

    /** Constant to set as a new governor address
     */
    address public NEW_GOVERNOR = 0x0000000000000000000000000000000000001101;

    constructor(Policy _policy) Policed(_policy) {}

    /** The name of the proposal.
     */
    function name() public pure override returns (string memory) {
        return "Sample";
    }

    /** A description of what the proposal does.
     */
    function description() public pure override returns (string memory) {
        return "A trackalbe sample";
    }

    /** A URL for more information.
     */
    function url() public pure override returns (string memory) {
        return "http://something";
    }

    /** Enact the proposal.
     */
    function enacted(address _self) public override {
        SampleProposal(_self).incrementCounter();
        SampleProposal(_self).setGovernor(NEW_GOVERNOR);
    }

    /** Function to test the enactment.
     */
    function incrementCounter() public onlyPolicy {
        ++counter;
    }

    /** Function to set a governor
     */
    function setGovernor(address newGovernor) public onlyPolicy {
        governors[newGovernor] = true;
    }
}