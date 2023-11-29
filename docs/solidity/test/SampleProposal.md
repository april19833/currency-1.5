# Eco Association

Copyright (c) 2023 Eco Association

## SampleProposal

**SampleProposal**

A proposal used for testing proposal adoption.

### counter

State variable to test

  ```solidity
  uint256 counter
  ```

### NEW_GOVERNOR

Constant to set as a new governor address

  ```solidity
  address NEW_GOVERNOR
  ```

### constructor

  ```solidity
  constructor() public
  ```

### name

The name of the proposal.

  ```solidity
  function name() public pure returns (string)
  ```

### description

A description of what the proposal does.

  ```solidity
  function description() public pure returns (string)
  ```

### url

A URL for more information.

  ```solidity
  function url() public pure returns (string)
  ```

### enacted

Enact the proposal.

  ```solidity
  function enacted(address _self) public
  ```

### incrementCounter

Function to test the enactment.

  ```solidity
  function incrementCounter() public
  ```

