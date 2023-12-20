// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../policy/Policy.sol";
import "../../../policy/Policed.sol";
import "./Proposal.sol";
import "../../monetary/TrustedNodes.sol";

/** @title SingleTrusteeReplacement
 * A proposal to replace one trustee
 */
contract SingleTrusteeReplacement is Policy, Proposal {
    // the TrustedNodes contract
    TrustedNodes public immutable trustedNodes;

    // the trustee that will be distrusted
    address public immutable oldTrustee;

    // the trustee that will be trusted
    address public immutable newTrustee;

    /** Instantiate a new proposal.
     *
     * @param _oldTrustee The existing trustee to distrust
     * @param _newTrustee The new address to become trusted
     */
    constructor(
        TrustedNodes _trustedNodes,
        address _oldTrustee,
        address _newTrustee
    ) Policy(address(0x0)) {
        trustedNodes = _trustedNodes;
        oldTrustee = _oldTrustee;
        newTrustee = _newTrustee;
    }

    /** The name of the proposal.
     */
    function name() public pure override returns (string memory) {
        return "Trustee Replacement Proposal Template";
    }

    /** A description of what the proposal does.
     */
    function description() public pure override returns (string memory) {
        return "Replaces a single trustee with another";
    }

    /** A URL where more details can be found.
     */
    function url() public pure override returns (string memory) {
        return
            "https://description.of.proposal make this link to a discussion of the no confidence vote";
    }

    /** Enact the proposal.
     *
     * This is executed in the storage context of the root policy contract.
     */
    function enacted(address) public override {
        trustedNodes.distrust(oldTrustee);
        trustedNodes.trust(newTrustee);
    }
}
