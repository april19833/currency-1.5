// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/IERC1820Registry.sol";
import "../proxy/ForwardTarget.sol";
import "./ERC1820Client.sol"; // this will become a storage gap

/** @title The policy contract that oversees other contracts
 *
 * Policy contracts provide a mechanism for building pluggable (after deploy)
 * governance systems for other contracts.
 */
contract Policy is ForwardTarget, ERC1820Client {
    uint256 private __gap; // to cover setters mapping

    /**
     * @dev mapping to store the contracts allowed to call functions
     */
    mapping(address => bool) public governers;

    /**
     * @dev error for when an address tries submit proposal actions without permission
     */
    error OnlyGoverners();

    /**
     * @dev error for when an address tries to call a pseudo-internal function
     */
    error OnlySelf();

    /**
     * for when a part of enacting a proposal reverts
     */
    error FailedProposalSubcall(address target, string reason);

    /**
     * emits when the governer permissions are changed
     * @param actor denotes the new address whose permissions are being updated
     * @param newPermission denotes the new ability of the actor address (true for can govern, false for cannot)
     */
    event UpdatedGoverners(address actor, bool newPermission);

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
     * @dev Modifier for checking if the sender is a governer
     */
    modifier onlyGovernerRole() {
        if (!governers[msg.sender]) {
            revert OnlyGoverners();
        }
        _;
    }

    /**
     * @dev Modifier for faux internal calls
     * see if we need this
     */
    modifier onlySelf() {
        if (!(msg.sender != address(this))) {
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
    function updateGoverners(address _key, bool _value) internal {
        governers[_key] = _value;
        emit UpdatedGoverners(_key, _value);
    }

    function enact(
        address proposal
    ) external virtual onlyGovernerRole {
        // solhint-disable-next-line avoid-low-level-calls
        (bool _success, ) = proposal.delegatecall(
            abi.encodeWithSignature("enacted(address)", proposal)
        );
        require(_success, "Command failed during delegatecall");

        emit EnactedGovernanceProposal(proposal, msg.sender);
    }
}
