# Eco Association

Copyright (c) 2023 Eco Association

## InflationSnapshots

### INITIAL_INFLATION_MULTIPLIER

```solidity
uint256 INITIAL_INFLATION_MULTIPLIER
```

### _inflationMultiplierSnapshot

```solidity
struct VoteSnapshots.Snapshot _inflationMultiplierSnapshot
```

### inflationMultiplier

```solidity
uint256 inflationMultiplier
```

### BadRebaseValue

```solidity
error BadRebaseValue()
```

error for when a rebase attempts to rebase incorrectly

### NewInflationMultiplier

```solidity
event NewInflationMultiplier(uint256 adjustinginflationMultiplier, uint256 cumulativeInflationMultiplier)
```

Fired when a proposal with a new inflation multiplier is selected and passed.
Used to calculate new values for the rebased token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| adjustinginflationMultiplier | uint256 | the multiplier that has just been applied to the tokens |
| cumulativeInflationMultiplier | uint256 | the total multiplier that is used to convert to and from gons |

### BaseValueTransfer

```solidity
event BaseValueTransfer(address from, address to, uint256 value)
```

### constructor

```solidity
constructor(contract Policy _policy, string _name, string _symbol, address _initialPauser) internal
```

Construct a new instance.

Note that it is always necessary to call reAuthorize on the balance store
after it is first constructed to populate the authorized interface
contracts cache. These calls are separated to allow the authorized
contracts to be configured/deployed after the balance store contract.

### initialize

```solidity
function initialize(address _self) public virtual
```

Storage initialization of cloned contract

This is used to initialize the storage of the forwarded contract, and
should (typically) copy or repeat any work that would normally be
done in the constructor of the proxied contract.

Implementations of ForwardTarget should override this function,
and chain to super.initialize(_self).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | The address of the original contract instance (the one being              forwarded to). |

### _rebase

```solidity
function _rebase(uint256 _inflationMultiplier) internal virtual
```

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual returns (uint256)
```

Update total supply snapshots before the values are modified. This is implemented
in the _beforeTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.

### inflationMultiplierSnapshot

```solidity
function inflationMultiplierSnapshot() public view returns (uint256)
```

### getPastLinearInflation

```solidity
function getPastLinearInflation(uint256) public view returns (uint256)
```

wrapper for inflationMultiplierSnapshot to maintain compatability with older interfaces
no requires even though return value might be misleading given inability to query old snapshots just to maintain maximum compatability

### balanceOf

```solidity
function balanceOf(address _owner) public view returns (uint256)
```

Access function to determine the token balance held by some address.

### voteBalanceOf

```solidity
function voteBalanceOf(address _owner) public view returns (uint256)
```

Access function to determine the voting balance (includes delegation) of some address.

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

Returns the total (inflation corrected) token supply

### totalSupplySnapshot

```solidity
function totalSupplySnapshot() public view returns (uint256)
```

Returns the total (inflation corrected) token supply for the current snapshot

### voteBalanceSnapshot

```solidity
function voteBalanceSnapshot(address account) public view returns (uint256)
```

Return snapshotted voting balance (includes delegation) for the current snapshot.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The account to check the votes of. |

