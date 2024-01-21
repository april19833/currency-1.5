# Eco Association

Copyright (c) 2023 Eco Association

## AddTxToNotifier

**LockupUpgradeAndNotifier
A proposal to update the Lockup implementation
Also**

### notifier

```solidity
contract Notifier notifier
```

### target

```solidity
address target
```

### txData

```solidity
bytes txData
```

### gasCost

```solidity
uint256 gasCost
```

### constructor

Instantiate a new proposal.

```solidity
constructor(contract Notifier _notifier, address _target, bytes _txData, uint256 _gasCost) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _notifier | contract Notifier | the addres of the notifier the tx is being added to |
| _target | address | target of tx |
| _txData | bytes | tx data |
| _gasCost | uint256 | cost of tx |

### name

The name of the proposal.

```solidity
function name() public pure returns (string)
```

### description

A description of what the proposal does.

```solidity
function description() public pure returns (string)
```

### url

A URL where more details can be found.

```solidity
function url() public pure returns (string)
```

### enacted

Adds new tx to notifier

```solidity
function enacted(address self) public
```

