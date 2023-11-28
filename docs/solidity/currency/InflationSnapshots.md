# Eco Association

Copyright (c) 2023 Eco Association

## InflationSnapshots

**InflationSnapshots**

_This implements a scaling inflation multiplier on all balances and votes.
Changing this value (via implementing _rebase)_

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

_error for when a rebase attempts to rebase incorrectly_

  ```solidity
  error BadRebaseValue()
  ```

### NewInflationMultiplier

_Fired when a proposal with a new inflation multiplier is selected and passed.
Used to calculate new values for the rebased token._

  ```solidity
  event NewInflationMultiplier(uint256 adjustinginflationMultiplier, uint256 cumulativeInflationMultiplier)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| adjustinginflationMultiplier | uint256 | the multiplier that has just been applied to the tokens |
| cumulativeInflationMultiplier | uint256 | the total multiplier that is used to convert to and from gons |

### BaseValueTransfer

_to be used to record the transfer amounts after _beforeTokenTransfer
these values are the base (unchanging) values the currency is stored in_

  ```solidity
  event BaseValueTransfer(address from, address to, uint256 value)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address transferring from |
| to | address | address transferring to |
| value | uint256 | the base value being transferred |

### constructor

Construct a new instance.

_Note that it is always necessary to call reAuthorize on the balance store
after it is first constructed to populate the authorized interface
contracts cache. These calls are separated to allow the authorized
contracts to be configured/deployed after the balance store contract._

  ```solidity
  constructor(contract Policy _policy, string _name, string _symbol, address _initialPauser) internal
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | the Policy |
| _name | string | the token name |
| _symbol | string | the token symbol |
| _initialPauser | address | the initial Pauser |

### initialize

_Initialize_

  ```solidity
  function initialize(address _self) public virtual
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | the address to initialize |

### _rebase

  ```solidity
  function _rebase(uint256 _inflationMultiplier) internal virtual
  ```

### _beforeTokenTransfer

Update total supply snapshots before the values are modified. This is implemented
in the _beforeTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.

  ```solidity
  function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual returns (uint256)
  ```

### inflationMultiplierSnapshot

_Inflation Multiplier Snapshot_

  ```solidity
  function inflationMultiplierSnapshot() public view returns (uint256)
  ```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Inflation Value Muliplier at time of the Snapshot |

### getPastLinearInflation

_wrapper for inflationMultiplierSnapshot to maintain compatability with older interfaces
no requires even though return value might be misleading given inability to query old snapshots just to maintain maximum compatability_

  ```solidity
  function getPastLinearInflation(uint256) public view returns (uint256)
  ```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Inflation Value Muliplier at time of the Snapshot |

### balanceOf

_Access function to determine the token balance held by some address._

  ```solidity
  function balanceOf(address _owner) public view returns (uint256)
  ```

### voteBalanceOf

_Access function to determine the voting balance (includes delegation) of some address._

  ```solidity
  function voteBalanceOf(address _owner) public view returns (uint256)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | the address of the account to get the balance for |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The vote balance fo the owner divided by the inflation multiplier |

### totalSupply

_Returns the total (inflation corrected) token supply_

  ```solidity
  function totalSupply() public view returns (uint256)
  ```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total supply divided by the inflation multiplier |

### totalSupplySnapshot

_Returns the total (inflation corrected) token supply for the current snapshot_

  ```solidity
  function totalSupplySnapshot() public view returns (uint256)
  ```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total supply snapshot divided by the inflation multiplier |

### voteBalanceSnapshot

_Return snapshotted voting balance (includes delegation) for the current snapshot._

  ```solidity
  function voteBalanceSnapshot(address account) public view returns (uint256)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The account to check the votes of. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | snapshotted voting balance (includes delegation) for the current snapshot. |

