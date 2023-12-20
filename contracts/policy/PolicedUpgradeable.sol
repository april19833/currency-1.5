// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Policed.sol";

/** @title Policed Proxy Contracts
 *
 * A PolicedUpgaredeable contract is any proxied contract managed by a policy.
 */
abstract contract PolicedUpgradeable is Policed, ForwardTarget {
    // storage gap covers PolicedUtils.expectedInterfaceSet
    // relevant for ECOxStaking
    uint256 private __gapPolicedUpgradeable;

    function setImplementation(address _impl) public onlyPolicy {
        _setImplementation(_impl);
    }
}
