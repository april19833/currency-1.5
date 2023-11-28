# Eco Association

Copyright (c) 2023 Eco Association

## IECO

### mint

_Only available to minters_

  ```solidity
  function mint(address to, uint256 amount) external
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | the address to mint to |
| amount | uint256 | the amount to mint |

### burn

_Only available to token holders for their own tokens and burners_

  ```solidity
  function burn(address from, uint256 amount) external
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | the address to burn from |
| amount | uint256 | the amount to burn |

### voteBalanceSnapshot

_Returns the votes for the current snapshot_

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

_Returns the inflation multiplier value for the current snapshot_

  ```solidity
  function inflationMultiplierSnapshot() external view returns (uint256)
  ```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | inflation multipler value |

### totalSupplySnapshot

_Returns the total supply for the current snapshot_

  ```solidity
  function totalSupplySnapshot() external view returns (uint256)
  ```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | total supply of the current snapshot |

