# Eco Association
Copyright (c) 2023 Eco Association

## TokenInit

### distribution

```solidity
struct distribution {
  address holder;
  uint256 balance;
}
```

### distributeTokens

```solidity
function distributeTokens(address _token, struct TokenInit.distribution[] _distributions) external
```

Transfer held tokens for the initial distribution.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | address | The address of the token contract. |
| _distributions | struct TokenInit.distribution[] | array of distribution address - balance pairs |

### constructor

```solidity
constructor() public
```

