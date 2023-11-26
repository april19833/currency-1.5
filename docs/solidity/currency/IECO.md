# Eco Association

Copyright (c) 2023 Eco Association

## IECO

### mint

  ```solidity
  function mint(address to, uint256 amount) external
  ```

Only available to minters

### burn

  ```solidity
  function burn(address from, uint256 amount) external
  ```

Only available to token holders for their own tokens and burners

### voteBalanceSnapshot

  ```solidity
  function voteBalanceSnapshot(address account) external view returns (uint256)
  ```

Returns the votes for the current snapshot

  ####
  Parameters | Name | Type | Description | | ---- | ---- | ----------- |
    |
    account
    |
    address
    |
    the address whose vote balance to check
    |

### inflationMultiplierSnapshot

  ```solidity
  function inflationMultiplierSnapshot() external view returns (uint256)
  ```

Returns the inflation multiplier value for the current snapshot

### totalSupplySnapshot

  ```solidity
  function totalSupplySnapshot() external view returns (uint256)
  ```

Returns the total supply for the current snapshot

