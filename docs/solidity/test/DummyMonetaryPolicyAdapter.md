# Eco Association

Copyright (c) 2023 Eco Association

## DummyMonetaryPolicyAdapter

**DummyMonetaryPolicyAdapter
For minimally testing enaction without having to give valid parameters**

### enacted

  ```solidity
  bool enacted
  ```

### EnactionParameterCheck

  ```solidity
  event EnactionParameterCheck(bytes32 proposalId, address[] targets, bytes4[] signatures, bytes[] calldatas)
  ```

### constructor

  ```solidity
  constructor(contract Policy _policy) public
  ```

### enact

  ```solidity
  function enact(bytes32 proposalId, address[] targets, bytes4[] signatures, bytes[] calldatas) external
  ```

