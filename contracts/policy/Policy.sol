// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../proxy/ForwardTarget.sol";

/** @title The policy contract that oversees other contracts
 *
 * Policy contracts provide a mechanism for building pluggable (after deploy)
 * governance systems for other contracts.
 */
contract Policy is ForwardTarget {
    uint256 private __gap; // to cover setters mapping

    /**
     * @dev mapping to store the contracts allowed to call functions
     */
    mapping(address => bool) public governors;

    /**
     * @dev error for when an address tries submit proposal actions without permission
     */
    error OnlyGovernors();

    /**
     * @dev error for when an address tries to call a pseudo-internal function
     */
    error OnlySelf();

    /**
     * for when a part of enacting a proposal reverts without a readable error
     * @param proposal the proposal address that got reverted during enaction
     */
    error FailedProposal(address proposal);

    /**
     * emits when the governor permissions are changed
     * @param actor denotes the new address whose permissions are being updated
     * @param newPermission denotes the new ability of the actor address (true for can govern, false for cannot)
     */
    event UpdatedGovernors(address actor, bool newPermission);

    /**
     * emits when enaction happens to keep record of enaction
     * @param proposal the proposal address that got successfully enacted
     * @param governor the contract which was the source of the proposal, source for looking up the calldata
     */
    event EnactedGovernanceProposal(
        address proposal,
        address governor
    );

    /**
     * @dev Modifier for checking if the sender is a governor
     */
    modifier onlyGovernorRole() {
        if (!governors[msg.sender]) {
            revert OnlyGovernors();
        }
        _;
    }

    /**
     * @dev Modifier for faux internal calls
     * needed for function to be called only during delegate call
     */
    modifier onlySelf() {
        if (msg.sender != address(this)) {
            revert OnlySelf();
        }
        _;
    }

    /**
     * @dev change the governance permissions for an address
     * internal function 
     * @param _key the address to change permissions for
     * @param _value the new permission. true = can govern, false = cannot govern
     */
    function updateGovernors(address _key, bool _value) public onlySelf() {
        governors[_key] = _value;
        emit UpdatedGovernors(_key, _value);
    }

    function enact(
        address proposal
    ) external virtual onlyGovernorRole {
        // solhint-disable-next-line avoid-low-level-calls
        (bool _success, bytes memory returndata) = proposal.delegatecall(
            abi.encodeWithSignature("enacted(address)", proposal)
        );
        if(!_success) {
            if (returndata.length == 0) revert FailedProposal(proposal);
            assembly {
                revert(add(32, returndata), mload(returndata))
            }
        }

        emit EnactedGovernanceProposal(proposal, msg.sender);
    }
}
