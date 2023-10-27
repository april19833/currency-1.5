// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/community/proposals/Proposal.sol";
import "../policy/Policy.sol";

/** @title FailureProposal
 *
 * A proposal used for testing proposal failures.
 */
contract FailureProposal is Policy, Proposal {
    /** Apologize in case of failure
     */
    error ImSorry();

    /** The name of the proposal.
     */
    function name() public pure override returns (string memory) {
        return "Reverter";
    }

    /** A description of what the proposal does.
     */
    function description() public pure override returns (string memory) {
        return "Built to fail!";
    }

    /** A URL for more information.
     */
    function url() public pure override returns (string memory) {
        return "http://something";
    }

    /** Enact the proposal.
     */
    function enacted(address _self) public override {
        revert ImSorry();
    }
}