# Eco Association

Copyright (c) 2023 Eco Association

## Policed

### policy

```solidity
contract Policy policy
```

The address of the root policy instance overseeing this instance.

### NonZeroPolicyAddr

```solidity
error NonZeroPolicyAddr()
```

If the policy address is set to zero, the contract is unrecoverably ungovernable

### NonZeroContractAddr

```solidity
error NonZeroContractAddr(string contractName)
```

If this address is set to zero the contract is an unusable state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contractName | string | the name of the contract that was given as the zero address |

### PolicyOnlyFunction

```solidity
error PolicyOnlyFunction()
```

For if a non-policy address tries to access policy role gated functionality

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

