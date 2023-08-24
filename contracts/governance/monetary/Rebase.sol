// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../currency/ECO.sol";
import "./Notifier.sol";
import "./Lever.sol";

/** @title Trustee monetary policy decision process
 *
 * This contract oversees the voting on the currency monetary levers.
 * Trustees vote on a policy that is implemented at the conclusion of the cycle
 */
contract Rebase is Lever {
    ECO public immutable eco;

    event Rebased(uint256 newInflation);

    constructor(
        Policy policy,
        Notifier notifier,
        ECO _eco
    ) Lever(policy, notifier) {
        eco = _eco;
    }

    function execute(uint256 _newMultiplier) public onlyAuthorized {
        // unclear how this works on the eco contract as of now, but ill shoot anyway
        eco.rebase(_newMultiplier);
        notifier.notify();

        emit Rebased(_newMultiplier);
    }
}
