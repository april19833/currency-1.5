# DummyMonetaryPolicyAdapter



> DummyMonetaryPolicyAdapter For minimally testing enaction without having to give valid parameters





## Methods

### currencyGovernance

```solidity
function currencyGovernance() external view returns (contract CurrencyGovernance)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract CurrencyGovernance | undefined |

### enact

```solidity
function enact(bytes32 proposalId, address[] targets, bytes4[] signatures, bytes[] calldatas) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | bytes32 | undefined |
| targets | address[] | undefined |
| signatures | bytes4[] | undefined |
| calldatas | bytes[] | undefined |

### enacted

```solidity
function enacted() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

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

### policy

```solidity
function policy() external view returns (contract Policy)
```

The address of the root policy instance overseeing this instance. This address can be used for ERC1820 lookup of other components, ERC1820 lookup of role policies, and interaction with the policy hierarchy.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Policy | undefined |

### setCurrencyGovernance

```solidity
function setCurrencyGovernance(contract CurrencyGovernance _currencyGovernance) external nonpayable
```

setter function for currencyGovernance var only available to the owning policy contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| _currencyGovernance | contract CurrencyGovernance | the value to set the new currencyGovernance address to, cannot be zero |



## Events

### EnactedMonetaryPolicy

```solidity
event EnactedMonetaryPolicy(bytes32 proposalId, contract CurrencyGovernance currencyGovernance, bool[] successes)
```

emits when enaction happens to keep record of enaction



#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId  | bytes32 | undefined |
| currencyGovernance  | contract CurrencyGovernance | undefined |
| successes  | bool[] | undefined |

### EnactionParameterCheck

```solidity
event EnactionParameterCheck(address[] targets, bytes4[] signatures, bytes[] calldatas)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| targets  | address[] | undefined |
| signatures  | bytes4[] | undefined |
| calldatas  | bytes[] | undefined |

### FailedPolicySubcall

```solidity
event FailedPolicySubcall(address target, string reason)
```

emits when a part of enacting a policy reverts



#### Parameters

| Name | Type | Description |
|---|---|---|
| target  | address | undefined |
| reason  | string | undefined |

### NewCurrencyGovernance

```solidity
event NewCurrencyGovernance(contract CurrencyGovernance newCurrencyGovernance, contract CurrencyGovernance oldCurrencyGovernance)
```

emits when the currencyGovernance contract is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| newCurrencyGovernance  | contract CurrencyGovernance | undefined |
| oldCurrencyGovernance  | contract CurrencyGovernance | undefined |

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



## Errors

### CurrencyGovernanceOnlyFunction

```solidity
error CurrencyGovernanceOnlyFunction()
```






### NonZeroCurrencyGovernanceAddr

```solidity
error NonZeroCurrencyGovernanceAddr()
```






### NonZeroPolicyAddr

```solidity
error NonZeroPolicyAddr()
```






### PolicyOnlyFunction

```solidity
error PolicyOnlyFunction()
```







