// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../currency/ECO.sol";
import "../../policy/Policy.sol";

/** @title Inflation Multiplier delegateCall setter contract
 *
 * A proposal used to set the inflation multiplier for the ECO contract as part of the migration
 */
contract SnapshotUpdatingTarget is ECO {
    // constructor args have no effect on delegated code
    constructor() ECO(Policy(address(1)), address(2)) {}

    function setInflationMultiplier(uint256 newMultiplier) public {
        inflationMultiplier = newMultiplier;
        uint32 _currentSnapshotBlock = uint32(block.number);
        currentSnapshotBlock = _currentSnapshotBlock;
        _inflationMultiplierSnapshot.snapshotBlock = _currentSnapshotBlock;
        _inflationMultiplierSnapshot.value = uint224(newMultiplier);
    }

    function setTotalSupplySnapshot() public {
        _totalSupplySnapshot.snapshotBlock = currentSnapshotBlock;
        _totalSupplySnapshot.value = uint224(_totalSupply);
    }
}
