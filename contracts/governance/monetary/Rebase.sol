// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../utils/TimeUtils.sol";
import "../../policy/Policed.sol";
import "../../currency/ECO.sol";

/** @title Trustee monetary policy decision process
 *
 * This contract oversees the voting on the currency monetary levers.
 * Trustees vote on a policy that is implemented at the conclusion of the cycle
 */
contract Rebase is Lever, TimeUtils {

    ECO public immutable eco;

    event Rebased(uint256 newInflation);

    constructor(address policy, address notifier, address _eco) Lever(policy, notifier) {
        eco = ECO(_eco);
    }

    function execute(uint256 _newMultiplier) public onlyCurrencyGovernance {
        // unclear how this works on the eco contract as of now, but ill shoot anyway
        eco.rebase(_newMultiplier);
        notifier.notify();

        emit Rebased(_newMultiplier);
    }

}