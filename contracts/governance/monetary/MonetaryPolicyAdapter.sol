// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../policy/Policed.sol";
import "../../policy/Policy.sol";
import "./CurrencyGovernance.sol";

/** @title Contract for managing permissions between currency governance and monetary policy levers
 *
 * This contract enacts the results of the currency governance
 * Its goal is to act as a long term address to pemission to allow execution of trustee governance and as a long term reference for event indexing of the results
 * This module can be replaced, but it eases the difficulty of the potentially more frequent changes to the CurrencyGovernance contract
 */
contract MonetaryPolicyAdapter is Policed {

    CurrencyGovernance public currencyGovernance;

    // If the currencyGovernance address is set to zero, the contract is unrecoverably ungovernable
    error NonZeroCurrencyGovernanceAddr();

    // For if a non-currencyGovernance address tries to access currencyGovernance role gated functionality
    error CurrencyGovernanceOnlyFunction();

    /**
     * emits when the currencyGovernance contract is changed
     * @param newCurrencyGovernance denotes the new currencyGovernance contract address
     * @param oldCurrencyGovernance denotes the old currencyGovernance contract address
     */
    event NewCurrencyGovernance(CurrencyGovernance newCurrencyGovernance, CurrencyGovernance oldCurrencyGovernance);

    /** Restrict method access to the root policy instance only.
     */
    modifier onlyCurrencyGovernance() {
        if (msg.sender != address(currencyGovernance)) {
            revert CurrencyGovernanceOnlyFunction();
        }
        _;
    }

    constructor(Policy _policy, CurrencyGovernance _currencyGovernance) Policed(_policy) {
        _setCurrencyGovernance(_currencyGovernance);
    }

    /** setter function for currencyGovernance var
     * only available to the owning policy contract
     * @param _currencyGovernance the value to set the new currencyGovernance address to, cannot be zero
     */
    function setCurrencyGovernance(CurrencyGovernance _currencyGovernance) public onlyPolicy {
        emit NewCurrencyGovernance(_currencyGovernance, currencyGovernance);
        _setCurrencyGovernance(_currencyGovernance);
    }

    function _setCurrencyGovernance(CurrencyGovernance _currencyGovernance) internal {
        if (address(_currencyGovernance) == address(0)) {
            revert NonZeroCurrencyGovernanceAddr();
        }
        currencyGovernance = _currencyGovernance;
    }

    function enact(
        address[] calldata targets,
        bytes4[] calldata signatures,
        bytes[] memory calldatas
    ) external virtual onlyCurrencyGovernance {

    }
}