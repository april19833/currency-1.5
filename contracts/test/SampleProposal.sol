// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/community/proposals/Proposal.sol";
import "../policy/Policy.sol";

/** @title SampleProposal
 *
 * A proposal used for testing proposal adoption.
 */
contract SampleProposal is Policy, Proposal {
    /** State variable to test
     */
    uint256 public counter;

    /** Constant to set as a new governor address
     */
    address public constant NEW_GOVERNOR =
        0x0000000000000000000000000000000000001101;

    /** The name of the proposal.
     */
    function name() public pure override returns (string memory) {
        return "Sample";
    }

    /** A description of what the proposal does.
     */
    function description() public pure override returns (string memory) {
        return "Change the governor variable";
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
        this.updateGovernor(NEW_GOVERNOR);
    }

    /** Function to test the enactment.
     */
    function incrementCounter() public {
        ++counter;
    }
}
