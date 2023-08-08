// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../policy/Policed.sol";

/** @title DummyPoliced
 * For minimally testing the abstract contract's functionality
 */
contract DummyPoliced is Policed {
    /** A value that will be changed by a policy action.
     */
    uint256 public value = 1;

    constructor(Policy _policy) Policed(_policy) {}

    function setValue(uint256 _newValue) public onlyPolicy {
        value = _newValue;
    }
}
