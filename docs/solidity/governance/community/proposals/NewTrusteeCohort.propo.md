# Eco Association

Copyright (c) 2023 Eco Association

## NewTrusteeCohort

**NewTrusteeCohort
A proposal to replace the current cohort of trustees**

### trustedNodesFactory

```solidity
contract TrustedNodesFactory trustedNodesFactory
```

### newTrustees

```solidity
address[] newTrustees
```

### termLength

```solidity
uint256 termLength
```

### voteReward

```solidity
uint256 voteReward
```

### constructor

Instantiate a new proposal.

```solidity
constructor(contract TrustedNodesFactory _trustedNodesFactory, address[] _newTrustees, uint256 _termLength, uint256 _voteReward) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _trustedNodesFactory | contract TrustedNodesFactory |  |
| _newTrustees | address[] | The array of new addresses to become trusted |
| _termLength | uint256 |  |
| _voteReward | uint256 |  |

### name

The name of the proposal.

```solidity
function name() public pure virtual returns (string)
```

### description

A description of what the proposal does.

```solidity
function description() public pure virtual returns (string)
```

### url

A URL where more details can be found.

```solidity
function url() public pure returns (string)
```

### returnNewTrustees

```solidity
function returnNewTrustees() public view returns (address[])
```

### enacted

Enact the proposal.

This is executed in the storage context of the root policy contract.

```solidity
function enacted(address self) public virtual
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| self | address | The address of the proposal. |

