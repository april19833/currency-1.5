# Eco Association
Copyright (c) 2023 Eco Association

## Notifier

### Transaction

```solidity
struct Transaction {
  address target;
  bytes data;
  uint256 gasCost;
}
```

### totalGasCost

```solidity
uint256 totalGasCost
```

### lever

```solidity
address lever
```

### transactions

```solidity
struct Notifier.Transaction[] transactions
```

### NonLeverCall

```solidity
error NonLeverCall()
```

### TransactionDataLengthMismatch

```solidity
error TransactionDataLengthMismatch(uint256 targetCount, uint256 dataCount, uint256 gasCostCount)
```

### NoTransactionAtIndex

```solidity
error NoTransactionAtIndex(uint256 index)
```

### TransactionFailed

```solidity
event TransactionFailed(uint256 index, address target, bytes data)
```

### onlyLever

```solidity
modifier onlyLever()
```

### constructor

```solidity
constructor(contract Policy policy, address _lever, address[] targets, bytes[] datas, uint256[] gasCosts) public
```

### notify

```solidity
function notify() public
```

### changeLever

```solidity
function changeLever(address _lever) public
```

### addTransaction

```solidity
function addTransaction(address _target, bytes _data, uint256 _gasCost) external
```

### removeTransaction

```solidity
function removeTransaction(uint256 index) external
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | Index of transaction to remove.              Transaction ordering may have changed since adding. |

