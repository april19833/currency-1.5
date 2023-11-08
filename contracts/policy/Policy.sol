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
    mapping(bytes32 => bool) public setters;

    modifier onlySetter(bytes32 _identifier) {
        require(
            setters[_identifier],
            "Identifier hash is not authorized for this action"
        );

        require(
            ERC1820REGISTRY.getInterfaceImplementer(
                address(this),
                _identifier
            ) == msg.sender,
            "Caller is not the authorized address for identifier"
        );

        _;
    }

    /** Remove the specified role from the contract calling this function.
     * This is for cleanup only, so if another contract has taken the
     * role, this does nothing.
     *
     * @param _interfaceIdentifierHash The interface identifier to remove from
     *                                 the registry.
     */
    event EnactedGovernanceProposal(address proposal, address governor);

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
    }

    /**
     * @dev change the governance permissions for an address
     * internal function
     * @param _key the address to change permissions for
     * @param _value the new permission. true = can govern, false = cannot govern
     */
    function updateGovernors(address _key, bool _value) public onlySelf {
        governors[_key] = _value;
        emit UpdatedGovernors(_key, _value);
    }

    function enact(address proposal) external virtual onlyGovernorRole {
        // solhint-disable-next-line avoid-low-level-calls
        (bool _success, ) = _delegate.delegatecall(
            abi.encodeWithSignature("enacted(address)", _delegate)
        );
        if (!_success) {
            if (returndata.length == 0) revert FailedProposal(proposal);
            assembly {
                revert(add(32, returndata), mload(returndata))
            }
        }

        emit EnactedGovernanceProposal(proposal, msg.sender);
    }
}
