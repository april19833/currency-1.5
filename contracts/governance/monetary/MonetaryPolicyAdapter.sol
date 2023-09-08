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
    event NewCurrencyGovernance(
        CurrencyGovernance newCurrencyGovernance,
        CurrencyGovernance oldCurrencyGovernance
    );

    /**
     * emits when enaction happens to keep record of enaction
     * @param proposalId the proposal lookup that got successfully enacted
     * @param currencyGovernance the CurrencyGovernance contract where you can look up the proposal calldata
     * @param successes the return success values from each of the calls to the targets in order
     */
    event EnactedMonetaryPolicy(
        bytes32 proposalId,
        CurrencyGovernance currencyGovernance,
        bool[] successes
    );

    event FailedPolicySubcall(address target, uint256 gasLeft, string reason);

    /** Restrict method access to the root policy instance only.
     */
    modifier onlyCurrencyGovernance() {
        if (msg.sender != address(currencyGovernance)) {
            revert CurrencyGovernanceOnlyFunction();
        }
        _;
    }

    constructor(
        Policy _policy,
        CurrencyGovernance _currencyGovernance
    ) Policed(_policy) {
        _setCurrencyGovernance(_currencyGovernance);
    }

    /** setter function for currencyGovernance var
     * only available to the owning policy contract
     * @param _currencyGovernance the value to set the new currencyGovernance address to, cannot be zero
     */
    function setCurrencyGovernance(
        CurrencyGovernance _currencyGovernance
    ) public onlyPolicy {
        emit NewCurrencyGovernance(_currencyGovernance, currencyGovernance);
        _setCurrencyGovernance(_currencyGovernance);
    }

    function _setCurrencyGovernance(
        CurrencyGovernance _currencyGovernance
    ) internal {
        if (address(_currencyGovernance) == address(0)) {
            revert NonZeroCurrencyGovernanceAddr();
        }
        currencyGovernance = _currencyGovernance;
    }

    function enact(
        bytes32 proposalId,
        address[] calldata targets,
        bytes4[] calldata signatures,
        bytes[] memory calldatas
    ) external virtual onlyCurrencyGovernance {
        bool[] memory successes = new bool[](targets.length);
        // the array lengths have all been vetted already by the proposal-making process
        // upstream is just trusted
        for (uint256 i = 0; i < targets.length; i++) {
            bytes memory callData;

            // use 0 to denote the desire to use the fallback function of the contract
            if (signatures[i] == bytes4(0)) {
                callData = calldatas[i];
            } else {
                callData = abi.encodePacked(signatures[i], calldatas[i]);
            }

            (bool success, bytes memory returnData) = targets[i].call(callData);

            if (!success) {
                emit FailedPolicySubcall(
                    targets[i],
                    gasleft(),
                    string(returnData)
                );
            }
            successes[i] = success;
        }

        emit EnactedMonetaryPolicy(proposalId, currencyGovernance, successes);
    }
}
