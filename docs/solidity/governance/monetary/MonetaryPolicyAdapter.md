# Eco Association

Copyright (c) 2023 Eco Association

## MonetaryPolicyAdapter

**Contract for managing permissions between currency governance and monetary policy levers**

This contract enacts the results of the currency governance
Its goal is to act as a long term address to pemission to allow execution of trustee governance and as a long term reference for event indexing of the results
This module can be replaced, but it eases the difficulty of the potentially more frequent changes to the CurrencyGovernance contract

### currencyGovernance

```solidity
contract CurrencyGovernance currencyGovernance
```

### NonZeroCurrencyGovernanceAddr

```solidity
error NonZeroCurrencyGovernanceAddr()
```

### CurrencyGovernanceOnlyFunction

```solidity
error CurrencyGovernanceOnlyFunction()
```

### NewCurrencyGovernance

emits when the currencyGovernance contract is changed

```solidity
event NewCurrencyGovernance(contract CurrencyGovernance newCurrencyGovernance, contract CurrencyGovernance oldCurrencyGovernance)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newCurrencyGovernance | contract CurrencyGovernance | denotes the new currencyGovernance contract address |
| oldCurrencyGovernance | contract CurrencyGovernance | denotes the old currencyGovernance contract address |

### EnactedMonetaryPolicy

emits when enaction happens to keep record of enaction

```solidity
event EnactedMonetaryPolicy(bytes32 proposalId, contract CurrencyGovernance currencyGovernance, bool[] successes)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposalId | bytes32 | the proposal lookup that got successfully enacted |
| currencyGovernance | contract CurrencyGovernance | the CurrencyGovernance contract where you can look up the proposal calldata |
| successes | bool[] | the return success values from each of the calls to the targets in order |

### FailedPolicySubcall

emits when a part of enacting a policy reverts

```solidity
event FailedPolicySubcall(address target, string reason)
```

### onlyCurrencyGovernance

Restrict method access to the root policy instance only.

```solidity
modifier onlyCurrencyGovernance()
```

### constructor

```solidity
constructor(contract Policy _policy) public
```

### setCurrencyGovernance

setter function for currencyGovernance var
only available to the owning policy contract

```solidity
function setCurrencyGovernance(contract CurrencyGovernance _currencyGovernance) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _currencyGovernance | contract CurrencyGovernance | the value to set the new currencyGovernance address to, cannot be zero |

### _setCurrencyGovernance

```solidity
function _setCurrencyGovernance(contract CurrencyGovernance _currencyGovernance) internal
```

### enact

```solidity
function enact(bytes32 proposalId, address[] targets, bytes4[] signatures, bytes[] calldatas) external virtual
```

