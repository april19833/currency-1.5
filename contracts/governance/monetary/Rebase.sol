// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TrustedNodes.sol";
import "../../utils/TimeUtils.sol";
import "../../policy/Policed.sol";
import "../../currency/ECO.sol";

/** @title Trustee monetary policy decision process
 *
 * This contract oversees the voting on the currency monetary levers.
 * Trustees vote on a policy that is implemented at the conclusion of the cycle
 */
contract Rebase is Policed, TimeUtils {
    
    mapping (address => bool) public currencyGovernance;

    ECO public immutable eco;

    error CurrencyGovernanceOnly();

    modifier onlyCurrencyGovernance() {
        if (!currencyGovernance[msg.sender]) {
            revert CurrencyGovernanceOnly;
        }
        _;
    }

    function setCurrencyGovernance(address _currencyGovernance, bool _status) public onlyPolicy{
        currencyGovernance[_currencyGovernance] = _status;
    }

    function rebase(uint256 _newMultiplier) public onlyCurrencyGovernance {
    }

}