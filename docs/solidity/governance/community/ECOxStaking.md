# Eco Association

Copyright (c) 2023 Eco Association

## ECOxStaking

**ECOxStaking**

### ecoXToken

  ```solidity
  contract IERC20 ecoXToken
  ```

### NoZeroECOx

  ```solidity
  error NoZeroECOx()
  ```

### NonTransferrable

  ```solidity
  error NonTransferrable()
  ```

### Deposit

  ```solidity
  event Deposit(address source, uint256 amount)
  ```

The Deposit event indicates that ECOx has been locked up, credited
to a particular address in a particular amount.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| source | address | The address that a deposit certificate has been issued to. |
| amount | uint256 | The amount of ECOx tokens deposited. |

### Withdrawal

  ```solidity
  event Withdrawal(address destination, uint256 amount)
  ```

The Withdrawal event indicates that a withdrawal has been made to a particular
address in a particular amount.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| destination | address | The address that has made a withdrawal. |
| amount | uint256 | The amount in basic unit of 10^{-18} ECOx (weicoX) tokens withdrawn. |

### constructor

  ```solidity
  constructor(contract Policy _policy, contract IERC20 _ecoXAddr) public
  ```

### deposit

  ```solidity
  function deposit(uint256 _amount) external
  ```

### withdraw

  ```solidity
  function withdraw(uint256 _amount) external
  ```

### votingECOx

  ```solidity
  function votingECOx(address _voter, uint256 _blockNumber) external view returns (uint256)
  ```

### totalVotingECOx

  ```solidity
  function totalVotingECOx(uint256 _blockNumber) external view returns (uint256)
  ```

### transfer

  ```solidity
  function transfer(address, uint256) public pure returns (bool)
  ```

### transferFrom

  ```solidity
  function transferFrom(address, address, uint256) public pure returns (bool)
  ```

