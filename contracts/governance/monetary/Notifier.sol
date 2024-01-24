// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../policy/Policy.sol";
import "../../policy/Policed.sol";

/**
 * @title Notifier
 * @notice This contract notifies downstream contracts of actions taken by the attached monetary policy
 * levers.
 *
 * Calls made to these downstream contracts are non-atomic with the lever actions themselves,
 * allowing the levers to operate as expected even if the notifier calls fail.
 */
contract Notifier is Policed {
    struct Transaction {
        address target;
        bytes data;
        uint256 gasCost;
    }

    uint256 public totalGasCost;

    address public lever;

    Transaction[] public transactions;

    error NonLeverCall();

    error TransactionDataLengthMismatch(
        uint256 targetCount,
        uint256 dataCount,
        uint256 gasCostCount
    );

    error NoTransactionAtIndex(uint256 index);

    event TransactionFailed(uint256 index, address target, bytes data);

    modifier onlyLever() {
        if (msg.sender != lever) {
            revert NonLeverCall();
        }
        _;
    }

    constructor(
        Policy policy,
        address _lever,
        address[] memory targets,
        bytes[] memory datas,
        uint256[] memory gasCosts
    ) Policed(policy) {
        uint256 targetsLength = targets.length;

        if (targetsLength != datas.length || targetsLength != gasCosts.length) {
            revert TransactionDataLengthMismatch(
                targetsLength,
                datas.length,
                gasCosts.length
            );
        }

        for (uint256 i = 0; i < targetsLength; i++) {
            transactions.push(
                Transaction({
                    target: targets[i],
                    data: datas[i],
                    gasCost: gasCosts[i]
                })
            );
            totalGasCost += gasCosts[i];
        }
        lever = _lever;
    }

    function notify() public onlyLever {
        uint256 txCount = transactions.length;

        for (uint256 i = 0; i < txCount; i++) {
            Transaction memory t = transactions[i];
            (bool success, ) = (t.target).call(t.data);

            if (!success) {
                emit TransactionFailed(i, t.target, t.data);
            }
        }
    }

    function changeLever(address _lever) public onlyPolicy {
        lever = _lever;
    }

    function addTransaction(
        address _target,
        bytes memory _data,
        uint256 _gasCost
    ) external onlyPolicy {
        transactions.push(
            Transaction({target: _target, data: _data, gasCost: _gasCost})
        );
        totalGasCost += _gasCost;
    }

    /**
     * @param index Index of transaction to remove.
     *              Transaction ordering may have changed since adding.
     */
    function removeTransaction(uint256 index) external onlyPolicy {
        if (index >= transactions.length) {
            revert NoTransactionAtIndex(index);
        }

        totalGasCost -= transactions[index].gasCost;

        if (index < transactions.length - 1) {
            transactions[index] = transactions[transactions.length - 1];
        }

        transactions.pop();
    }
}
