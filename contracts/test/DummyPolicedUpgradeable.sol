// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../policy/PolicedUpgradeable.sol";

/** @title DummyPolicedUpgradeable
 * For minimally testing the abstract contract's functionality
 */
contract DummyPolicedUpgradeable is PolicedUpgradeable {
    constructor(Policy _policy) Policed(_policy) {}
}
