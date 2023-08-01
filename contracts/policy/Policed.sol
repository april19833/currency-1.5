// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../proxy/ForwardTarget.sol";
import "./Policy.sol";

/** @title Policed Contracts
 *
 * A policed contract is any contract managed by a policy.
 */
abstract contract Policed is ForwardTarget {

    /** The address of the root policy instance overseeing this instance.
     *
     * This address can be used for ERC1820 lookup of other components, ERC1820
     * lookup of role policies, and interaction with the policy hierarchy.
     */
    Policy public policy;

    // If the policy address is set to zero, the contract is unrecoverably ungovernable
    error NonZeroPolicyAddr();

    /** 
     * emits when the policy contract is changed
     * @param newPolicy denotes the new policy contract address
     * @param oldPolicy denotes the new policy contract address
     */

    event NewPolicy(Policy newPolicy, Policy oldPolicy);

    /** Restrict method access to the root policy instance only.
     */
    modifier onlyPolicy() {
        require(
            msg.sender == address(policy),
            "Only the policy contract may call this method"
        );
        _;
    }

    constructor(Policy _policy) {
        _setPolicy(_policy);
    }

    function setPolicy(Policy _policy) external onlyPolicy {
        emit NewPolicy(_policy, policy);
        _setPolicy(_policy);
    }

    function _setPolicy(Policy _policy) private {
        if(
            address(_policy) == address(0)
        ) {
            revert NonZeroPolicyAddr();
        }
        policy = _policy;
    }
}
