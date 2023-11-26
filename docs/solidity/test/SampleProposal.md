# Eco Association

Copyright (c) 2023 Eco Association

## SampleProposal

**SampleProposal

A proposal used for testing proposal adoption.**

### counter

  ```solidity
  uint256 counter
  ```

State variable to test

### NEW_GOVERNOR

  ```solidity
  address NEW_GOVERNOR
  ```

Constant to set as a new governor address

### constructor

  ```solidity
  constructor() public
  ```

### name

  ```solidity
  function name() public pure returns (string)
  ```

The name of the proposal.

### description

  ```solidity
  function description() public pure returns (string)
  ```

A description of what the proposal does.

### url

  ```solidity
  function url() public pure returns (string)
  ```

A URL for more information.

### enacted

  ```solidity
  function enacted(address _self) public
  ```

Enact the proposal.

### incrementCounter

  ```solidity
  function incrementCounter() public
  ```

Function to test the enactment.

