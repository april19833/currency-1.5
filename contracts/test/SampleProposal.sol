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

    /** Address to confirm is false (alice)
     */
    address public constant REMOVE_GOVERNOR =
        0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

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
        this.updateGovernors(REMOVE_GOVERNOR, false);
        this.updateGovernors(NEW_GOVERNOR, true);
    }

    /** Function to test the enactment.
     */
    function incrementCounter() public {
        ++counter;
    }
}
