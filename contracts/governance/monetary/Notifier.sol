// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../policy/Policed.sol";

contract Notifier is Policed{

    struct Transaction {
        address target;
        bytes data;
        uint256 gasCost;
    }

    uint256 public totalGasCost;

    address public lever;

    Transaction[] public transactions;

    error NonLeverCall();

    error TargetDataLengthMismatch(uint256 targetCount, uint256 dataCount);

    error NoTransactionAtIndex(uint256 index);

    event TransactionFailed(uint256 index, address target, bytes data);

    modifier onlyLever() {
        if (msg.sender != lever) {
            revert onlyLever();
        } 
        _;
    }

    constructor(address _lever, address[] targets, bytes[] datas, uint256[] gasCosts) {
        lever = _lever;
        uint256 targetsLength = targets.length;

        if (targetsLength != datas.length || targetsLength != gasCosts.length || targetsLength == 0) {
            revert TargetDataLengthMismatch(targetsLength, datas.length);
        }
        for (uint256 i = 0; i < targetsLength; i++) {
            transactions.push(Transaction{target: targets[i], data: datas[i], gasCost: gasCosts[i]});
            totalGasCost += gasCosts[i];
        }

        
    }

    function notify() public onlyLever() {
        uint256 txCount = transactions.length();

        for (uint256 i = 0; i < txCount; i++) {
            Transaction storage t = transactions[i];
            bool success = t.target.call{gas: t.gas}(t.data);
            
            if (!success) {
                emit TransactionFailed(i, t.target, t.data);
            }
        }
    }

    function changeLever(address _lever) public onlyPolicy {
        lever = _lever;
    }

    function addTransaction(address _target, bytes memory _data, uint256 _gasCost)
        external
        onlyPolicy
    {
        transactions.push(Transaction({target: _target, data: _data, gasCost: _gasCost}));
    }

    /**
     * @param index Index of transaction to remove.
     *              Transaction ordering may have changed since adding.
     */
    function removeTransaction(uint256 index) external onlyPolicy {
        require(index < transactions.length, "index out of bounds");
        if (index < transactions.length) {
            revert NoTransactionAtIndex(index);
        }
        
        totalGasCost -= transactions[index].gasCost;

        if (index < transactions.length - 1) {
            transactions[index] = transactions[transactions.length - 1];
        }

        transactions.pop();
    }

    
}