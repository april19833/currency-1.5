# Eco Association

Copyright (c) 2023 Eco Association

## Policed

### policy

```solidity
contract Policy policy
```

The address of the root policy instance overseeing this instance.

This address can be used for ERC1820 lookup of other components, ERC1820
lookup of role policies, and interaction with the policy hierarchy.

### NonZeroPolicyAddr

```solidity
error NonZeroPolicyAddr()
```

### PolicyOnlyFunction

```solidity
error PolicyOnlyFunction()
```

### NewPolicy

```solidity
event NewPolicy(contract Policy newPolicy, contract Policy oldPolicy)
```

emits when the policy contract is changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newPolicy | contract Policy | denotes the new policy contract address |
| oldPolicy | contract Policy | denotes the old policy contract address |

### onlyPolicy

```solidity
modifier onlyPolicy()
```

Restrict method access to the root policy instance only.

### constructor

```solidity
constructor(contract Policy _policy) internal
```

constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | the address of the owning policy contract |

