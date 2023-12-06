// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../currency/ECO.sol";
import "../policy/Policy.sol";

/** @title Inflation Multiplier delegateCall setter contract
 *
 * A proposal used to set the inflation multiplier for the ECO contract as part of the migration
 */
contract InflationMultiplierUpdatingTarget is ECO {
    // constructor args have no effect on delegated code
    constructor() ECO(Policy(address(1)), address(2)) {}

    function setInflationMultiplier(uint256 newMultiplier) public {
        inflationMultiplier = newMultiplier;
    }
}
