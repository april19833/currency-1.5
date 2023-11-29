# Eco Association

Copyright (c) 2023 Eco Association

## IECO

### mint

Only available to minters

  ```solidity
  function mint(address to, uint256 amount) external
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | the address to mint to |
| amount | uint256 | the amount to mint |

### burn

Only available to token holders for their own tokens and burners

  ```solidity
  function burn(address from, uint256 amount) external
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | the address to burn from |
| amount | uint256 | the amount to burn |

### voteBalanceSnapshot

Returns the votes for the current snapshot

  ```solidity
  function voteBalanceSnapshot(address account) external view returns (uint256)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address whose vote balance to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the balance of the account at the time of the Snapshot |

### inflationMultiplierSnapshot

Returns the inflation multiplier value for the current snapshot

  ```solidity
  function inflationMultiplierSnapshot() external view returns (uint256)
  ```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | inflation multipler value |

### totalSupplySnapshot

Returns the total supply for the current snapshot

  ```solidity
  function totalSupplySnapshot() external view returns (uint256)
  ```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | total supply of the current snapshot |

