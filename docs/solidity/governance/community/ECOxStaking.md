# Eco Association

Copyright (c) 2023 Eco Association

## ECOxStaking

**ECOxStaking**

### ecoXToken

the ECOx contract address

```solidity
contract IERC20 ecoXToken
```

### NoZeroECOx

error for if the constructor tries to set the ECOx address to zero

```solidity
error NoZeroECOx()
```

### NonTransferrable

error for if any transfer function is attempted to be used

```solidity
error NonTransferrable()
```

### Deposit

The Deposit event indicates that ECOx has been locked up, credited
to a particular address in a particular amount.

```solidity
event Deposit(address source, uint256 amount)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| source | address | The address that a deposit certificate has been issued to. |
| amount | uint256 | The amount of ECOx tokens deposited. |

### Withdrawal

The Withdrawal event indicates that a withdrawal has been made to a particular
address in a particular amount.

```solidity
event Withdrawal(address destination, uint256 amount)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| destination | address | The address that has made a withdrawal. |
| amount | uint256 | The amount in basic unit of 10^{-18} ECOx (weicoX) tokens withdrawn. |

### constructor

```solidity
constructor(contract Policy _policy, contract IERC20 _ecoXAddr) public
```

### deposit

deposit transfers ECOx to the contract and mints sECOx to the source of the transfer determined by `msg.sender`.

```solidity
function deposit(uint256 _amount) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | the amount of ECOx to deposit |

### withdraw

withdraw burns the senders sECOx and transfers ECOx to the source of the transfer determined by `msg.sender`.

```solidity
function withdraw(uint256 _amount) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | the amount of ECOx to withdraw |

### votingECOx

Gets the past votes for a voter at a specific block

```solidity
function votingECOx(address _voter, uint256 _blockNumber) external view returns (uint256 pastVotes)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _voter | address | the address of the voter |
| _blockNumber | uint256 | the block number to retrieve the votes from |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| pastVotes | uint256 | the past votes at the block number |

### totalVotingECOx

Gets the total supply at a specific block number

```solidity
function totalVotingECOx(uint256 _blockNumber) external view returns (uint256 totalSupply)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _blockNumber | uint256 | the block to get the votes for |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalSupply | uint256 | the total supply at the block number |

### transfer

transfers are disabled and revert with a NonTransferrable error

```solidity
function transfer(address, uint256) public pure returns (bool)
```

### transferFrom

transferFroms are disabled and revert with a NonTransferrable error

```solidity
function transferFrom(address, address, uint256) public pure returns (bool)
```

