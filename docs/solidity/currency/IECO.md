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
function voteBalanceSnapshot(address account) external view returns (uint256 balance)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address whose vote balance to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| balance | uint256 | the balance of the account at the time of the Snapshot |

### inflationMultiplierSnapshot

Returns the inflation multiplier value for the current snapshot

```solidity
function inflationMultiplierSnapshot() external view returns (uint256 multiplier)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| multiplier | uint256 | inflation multipler value |

### totalSupplySnapshot

Returns the total supply for the current snapshot

```solidity
function totalSupplySnapshot() external view returns (uint256 total)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| total | uint256 | total supply of the current snapshot |

### enableVoting

Enables voting with your ECO balance, but will transaction cost

```solidity
function enableVoting() external
```

### enableDelegationTo

Allows others to delegate voting power to you
Disallows you from delegating your voting power to others

```solidity
function enableDelegationTo() external
```

### disableDelegationTo

Disallows others from delegating to you
Does not change your ability to delegate to others

```solidity
function disableDelegationTo() external
```

### reenableDelegating

Allows others to delegate to you
Disallows you from delegating to others

```solidity
function reenableDelegating() external
```

### isOwnDelegate

Returns true if the address has no amount of their balance delegated, otherwise false

```solidity
function isOwnDelegate(address account) external returns (bool)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address whose delegation status is being checked |

### getPrimaryDelegate

Fetches the primary address `account` is currently delegating to. Defaults to the account address itself if none specified.
The primary delegate is the one that is delegated any new funds the address recieves

```solidity
function getPrimaryDelegate(address account) external view returns (address)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address whose primary delegate is being fetched |

### delegate

Delegates all votes from the sender to `delegatee`
This function assumes that you do not have partial delegations
It will revert with "ERC20Delegated: must have an undelegated amount available to cover delegation" if you do

```solidity
function delegate(address delegatee) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the address being delegated to |

### delegateBySig

Delegates all votes from the sender to `delegatee`
This function assumes that you do not have partial delegations
It will revert with "ERC20Delegated: must have an undelegated amount available to cover delegation" if you do

```solidity
function delegateBySig(address delegator, address delegatee, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegator | address | the address delegating votes |
| delegatee | address | the address being delegated to |
| deadline | uint256 | the time at which the signature expires |
| v | uint8 | signature value |
| r | bytes32 | signature value |
| s | bytes32 | signature value |

### delegateAmount

Delegate an `amount` of votes from the sender to `delegatee`

```solidity
function delegateAmount(address delegatee, uint256 amount) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the address being delegated to |
| amount | uint256 | the amount of tokens being allocated |

### undelegate

Undelegate all votes from the sender's primary delegate

```solidity
function undelegate() external
```

### revokeDelegation

Allows a primary delegated individual to revoke delegations of unwanted delegators
Useful for allowing yourself to call reenableDelegating after calling disableDelegationTo

```solidity
function revokeDelegation(address delegator) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegator | address | the address whose delegation is being revoked |

### undelegateAmountFromAddress

Undelegate a specific amount of votes from the `delegatee` back to the sender

```solidity
function undelegateAmountFromAddress(address delegatee, uint256 amount) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the address being undelegated to |
| amount | uint256 | the amount of tokens being undelegated |

### voteBalanceOf

See {IERC20-balanceOf}.

```solidity
function voteBalanceOf(address account) external view returns (uint256)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address whose vote balance is being checked |

