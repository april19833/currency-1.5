// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../policy/Policy.sol";
import "../../policy/Policed.sol";
import "./Notifier.sol";

/**
 * @title Monetary policy lever
 * @notice This contract is a generic monetary policy lever and is inherited by all lever implementations.
 */
contract Lever is Policed {
    mapping(address => bool) public authorized;

    Notifier public notifier;

    error AuthorizedOnly();

    event AuthorizationChanged(address agent, bool status);

    event NotifierChanged(Notifier oldNotifier, Notifier newNotifier);

    modifier onlyAuthorized() {
        if (!authorized[msg.sender]) {
            revert AuthorizedOnly();
        }
        _;
    }

    constructor(Policy _policy) Policed(_policy) {}

    /**
     * Changes the authorized status of an address.
     * @param _agent The address whose status is changing
     * @param _status The new status of _agent
     */
    function setAuthorized(address _agent, bool _status) public onlyPolicy {
        authorized[_agent] = _status;
        emit AuthorizationChanged(_agent, _status);
    }

    /**
     * Changes the notifier for the lever.
     * @param _notifier The new notifier address
     */
    function setNotifier(Notifier _notifier) public onlyPolicy {
        emit NotifierChanged(notifier, _notifier);
        notifier = Notifier(_notifier);
    }
}
