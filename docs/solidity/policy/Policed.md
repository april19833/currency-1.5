# Eco Association

Copyright (c) 2023 Eco Association

## Policed

**Policed Contracts**

A policed contract is any contract managed by a policy.

### policy

The address of the root policy instance overseeing this instance.

  ```solidity
  contract Policy policy
  ```

### NonZeroPolicyAddr

If the policy address is set to zero, the contract is unrecoverably ungovernable

  ```solidity
  error NonZeroPolicyAddr()
  ```

### NonZeroContractAddr

If this address is set to zero the contract is an unusable state

  ```solidity
  error NonZeroContractAddr(string contractName)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contractName | string | the name of the contract that was given as the zero address |

### PolicyOnlyFunction

For if a non-policy address tries to access policy role gated functionality

  ```solidity
  error PolicyOnlyFunction()
  ```

### NewPolicy

emits when the policy contract is changed

  ```solidity
  event NewPolicy(contract Policy newPolicy, contract Policy oldPolicy)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newPolicy | contract Policy | denotes the new policy contract address |
| oldPolicy | contract Policy | denotes the old policy contract address |

### onlyPolicy

Restrict method access to the root policy instance only.

  ```solidity
  modifier onlyPolicy()
  ```

### constructor

constructor

  ```solidity
  constructor(contract Policy _policy) internal
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | the address of the owning policy contract |

