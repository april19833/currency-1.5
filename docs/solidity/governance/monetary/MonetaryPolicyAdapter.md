# Eco Association

Copyright (c) 2023 Eco Association

## MonetaryPolicyAdapter

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

```solidity
event NewCurrencyGovernance(contract CurrencyGovernance newCurrencyGovernance, contract CurrencyGovernance oldCurrencyGovernance)
```

emits when the currencyGovernance contract is changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newCurrencyGovernance | contract CurrencyGovernance | denotes the new currencyGovernance contract address |
| oldCurrencyGovernance | contract CurrencyGovernance | denotes the old currencyGovernance contract address |

### EnactedMonetaryPolicy

```solidity
event EnactedMonetaryPolicy(bytes32 proposalId, contract CurrencyGovernance currencyGovernance, bool[] successes)
```

emits when enaction happens to keep record of enaction

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposalId | bytes32 | the proposal lookup that got successfully enacted |
| currencyGovernance | contract CurrencyGovernance | the CurrencyGovernance contract where you can look up the proposal calldata |
| successes | bool[] | the return success values from each of the calls to the targets in order |

### FailedPolicySubcall

```solidity
event FailedPolicySubcall(address target, string reason)
```

emits when a part of enacting a policy reverts

### onlyCurrencyGovernance

```solidity
modifier onlyCurrencyGovernance()
```

Restrict method access to the root policy instance only.

### constructor

```solidity
constructor(contract Policy _policy, contract CurrencyGovernance _currencyGovernance) public
```

### setCurrencyGovernance

```solidity
function setCurrencyGovernance(contract CurrencyGovernance _currencyGovernance) public
```

setter function for currencyGovernance var
only available to the owning policy contract

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

