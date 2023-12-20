// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/community/proposals/Proposal.sol";
import "../policy/Policy.sol";
import "../policy/PolicedUpgradeable.sol";

/** @title upgrade PolicedUpgradeable proxy implementation proposal
 *
 * A proposal used to change the implmentation for one of the protocol's proxies
 */
contract UpdatePolicedProxyImplProposal is Policy, Proposal {
    PolicedUpgradeable public immutable targetProxy;

    address public immutable newImpl;

    constructor(
        PolicedUpgradeable _targetProxy,
        address _newImpl
    ) Policy(address(0x0)) {
        targetProxy = _targetProxy;
        newImpl = _newImpl;
    }

    function name() public pure override returns (string memory) {
        return "upgrade PolicedUpgradeable proxy implementation proposal";
    }

    function description() public pure override returns (string memory) {
        return "change the governance contract for the trusted nodes contract";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        targetProxy.setImplementation(newImpl);
    }
}
