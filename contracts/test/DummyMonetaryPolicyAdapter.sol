// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/monetary/MonetaryPolicyAdapter.sol";

/** @title DummyMonetaryPolicyAdapter
 * For minimally testing enaction without having to give valid parameters
 */
contract DummyMonetaryPolicyAdapter is MonetaryPolicyAdapter {
    bool public enacted;

    constructor(Policy _policy, CurrencyGovernance _currencyGovernance)
        MonetaryPolicyAdapter(_policy, _currencyGovernance)
    {}

    function enact(
        address[] calldata targets,
        bytes4[] calldata signatures,
        bytes[] memory calldatas
    ) external override onlyCurrencyGovernance() {
        enacted = true;
    }
}
