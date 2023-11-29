// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../proxy/ForwardTarget.sol";
import "./Policy.sol";

/**
 * @title Policed Contracts
 * @notice A policed contract is any contract managed by a policy.
 */
abstract contract Policed is ForwardTarget {
    /** The address of the root policy instance overseeing this instance.
     */
    Policy public immutable policy;

    /** If the policy address is set to zero, the contract is unrecoverably ungovernable
     */
    error NonZeroPolicyAddr();

    /**
     * If this address is set to zero the contract is an unusable state
     * @param contractName the name of the contract that was given as the zero address
     */
    error NonZeroContractAddr(string contractName);

    /** For if a non-policy address tries to access policy role gated functionality
     */
    error PolicyOnlyFunction();

    /**
     * emits when the policy contract is changed
     * @param newPolicy denotes the new policy contract address
     * @param oldPolicy denotes the old policy contract address
     */
    event NewPolicy(Policy newPolicy, Policy oldPolicy);

    /** Restrict method access to the root policy instance only.
     */
    modifier onlyPolicy() {
        if (msg.sender != address(policy)) {
            revert PolicyOnlyFunction();
        }
        _;
    }

    /** constructor
     * @param _policy the address of the owning policy contract
     */
    constructor(Policy _policy) {
        // _setPolicy(_policy);
        if (address(_policy) == address(0)) {
            revert NonZeroPolicyAddr();
        }
        policy = _policy;
    }
}
