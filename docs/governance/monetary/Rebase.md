# Rebase



> Rebase lever This contract is a monetary policy lever that rebases the eco currency in accordance with the decision made by the slate of trustees.





## Methods

### authorized

```solidity
function authorized(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### eco

```solidity
function eco() external view returns (contract ECO)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ECO | undefined |

### execute

```solidity
function execute(uint256 _newMultiplier) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _newMultiplier | uint256 | undefined |

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

### notifier

```solidity
function notifier() external view returns (contract Notifier)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Notifier | undefined |

### policy

```solidity
function policy() external view returns (contract Policy)
```

The address of the root policy instance overseeing this instance. This address can be used for ERC1820 lookup of other components, ERC1820 lookup of role policies, and interaction with the policy hierarchy.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Policy | undefined |

### setAuthorized

```solidity
function setAuthorized(address _agent, bool _status) external nonpayable
```

Changes the authorized status of an address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _agent | address | The address whose status is changing |
| _status | bool | The new status of _agent |

### setNotifier

```solidity
function setNotifier(contract Notifier _notifier) external nonpayable
```

Changes the notifier for the lever.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _notifier | contract Notifier | The new notifier address |



## Events

### AuthorizationChanged

```solidity
event AuthorizationChanged(address agent, bool status)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| agent  | address | undefined |
| status  | bool | undefined |

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

### NotifierChanged

```solidity
event NotifierChanged(contract Notifier oldNotifier, contract Notifier newNotifier)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| oldNotifier  | contract Notifier | undefined |
| newNotifier  | contract Notifier | undefined |

### Rebased

```solidity
event Rebased(uint256 newInflation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newInflation  | uint256 | undefined |



## Errors

### AuthorizedOnly

```solidity
error AuthorizedOnly()
```






### BadInflationMultiplier

```solidity
error BadInflationMultiplier(uint256 rate)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| rate | uint256 | undefined |

### NonZeroPolicyAddr

```solidity
error NonZeroPolicyAddr()
```






### PolicyOnlyFunction

```solidity
error PolicyOnlyFunction()
```







