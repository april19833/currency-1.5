// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/monetary/MonetaryPolicyAdapter.sol";

/**
 * @title DummyMonetaryPolicyAdapter
 * @notice For minimally testing enaction without having to give valid parameters
 */
contract DummyMonetaryPolicyAdapter is MonetaryPolicyAdapter {
    bool public enacted;

    event EnactionParameterCheck(
        bytes32 proposalId,
        address[] targets,
        bytes4[] signatures,
        bytes[] calldatas
    );

    constructor(Policy _policy) MonetaryPolicyAdapter(_policy) {}

    function enact(
        bytes32 proposalId,
        address[] calldata targets,
        bytes4[] calldata signatures,
        bytes[] memory calldatas
    ) external override onlyCurrencyGovernance {
        enacted = true;
        emit EnactionParameterCheck(proposalId, targets, signatures, calldatas);
    }
}
