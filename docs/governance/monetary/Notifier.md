# Notifier



> Notifier This contract notifies downstream contracts of actions taken by the attached monetary policy levers. Calls made to these downstream contracts are non-atomic with the lever actions themselves, allowing the levers to operate as expected even if the notifier calls fail.





## Methods

### addTransaction

```solidity
function addTransaction(address _target, bytes _data, uint256 _gasCost) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _target | address | undefined |
| _data | bytes | undefined |
| _gasCost | uint256 | undefined |

### changeLever

```solidity
function changeLever(address _lever) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _lever | address | undefined |

### implementation

```solidity
function implementation() external view returns (address _impl)
```

Get the address of the proxy target contract.




#### Returns

| Name | Type | Description |
|---|---|---|
| _impl | address | undefined |

### initialize

```solidity
function initialize(address _self) external nonpayable
```

Storage initialization of cloned contract This is used to initialize the storage of the forwarded contract, and should (typically) copy or repeat any work that would normally be done in the constructor of the proxied contract. Implementations of ForwardTarget should override this function, and chain to super.initialize(_self).



#### Parameters

| Name | Type | Description |
|---|---|---|
| _self | address | The address of the original contract instance (the one being              forwarded to). |

### lever

```solidity
function lever() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### notify

```solidity
function notify() external nonpayable
```






### policy

```solidity
function policy() external view returns (contract Policy)
```

The address of the root policy instance overseeing this instance. This address can be used for ERC1820 lookup of other components, ERC1820 lookup of role policies, and interaction with the policy hierarchy.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Policy | undefined |

### removeTransaction

```solidity
function removeTransaction(uint256 index) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | Index of transaction to remove.              Transaction ordering may have changed since adding. |

### totalGasCost

```solidity
function totalGasCost() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### transactions

```solidity
function transactions(uint256) external view returns (address target, bytes data, uint256 gasCost)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| target | address | undefined |
| data | bytes | undefined |
| gasCost | uint256 | undefined |



## Events

### NewPolicy

```solidity
event NewPolicy(contract Policy newPolicy, contract Policy oldPolicy)
```

emits when the policy contract is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| newPolicy  | contract Policy | undefined |
| oldPolicy  | contract Policy | undefined |

### TransactionFailed

```solidity
event TransactionFailed(uint256 index, address target, bytes data)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| index  | uint256 | undefined |
| target  | address | undefined |
| data  | bytes | undefined |



## Errors

### NoTransactionAtIndex

```solidity
error NoTransactionAtIndex(uint256 index)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | undefined |

### NonLeverCall

```solidity
error NonLeverCall()
```






### NonZeroPolicyAddr

```solidity
error NonZeroPolicyAddr()
```






### PolicyOnlyFunction

```solidity
error PolicyOnlyFunction()
```






### TransactionDataLengthMismatch

```solidity
error TransactionDataLengthMismatch(uint256 targetCount, uint256 dataCount, uint256 gasCostCount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| targetCount | uint256 | undefined |
| dataCount | uint256 | undefined |
| gasCostCount | uint256 | undefined |


