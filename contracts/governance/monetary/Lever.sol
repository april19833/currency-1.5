// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../utils/TimeUtils.sol";
import "../../policy/Policed.sol";
import "./Notifier.sol";

/** @title Trustee monetary policy decision process
 *
 * This contract oversees the voting on the currency monetary levers.
 * Trustees vote on a policy that is implemented at the conclusion of the cycle
 */
contract Lever is Policed, TimeUtils {
    mapping (address => bool) public authorized;

    Notifier public notifier;

    error AuthorizedOnly();

    modifier onlyAuthorized() {
        if (!authorized[msg.sender]) {
            revert AuthorizedOnly();
        }
        _;
    }

    constructor(address _policy, address _notifier) Policed(_policy) {
        notifier = _notifier;
    }

    function setAuthorized(address _agent, bool _status) public onlyPolicy {
        authorized[_agent] = _status;
    }

    function setNotifier(address _notifier) public onlyPolicy {
        notifier = Notifier(_notifier);
    }
}