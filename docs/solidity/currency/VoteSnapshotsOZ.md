# Eco Association
Copyright (c) 2023 Eco Association

## c_6ab279c3

```solidity
function c_6ab279c3(bytes8 c__6ab279c3) internal pure
```

## c_true6ab279c3

```solidity
function c_true6ab279c3(bytes8 c__6ab279c3) internal pure returns (bool)
```

## c_false6ab279c3

```solidity
function c_false6ab279c3(bytes8 c__6ab279c3) internal pure returns (bool)
```

## VoteSnapshots

ECO-specific adjustments:

### c_69457152

```solidity
function c_69457152(bytes8 c__69457152) internal pure
```

### c_true69457152

```solidity
function c_true69457152(bytes8 c__69457152) internal pure returns (bool)
```

### c_false69457152

```solidity
function c_false69457152(bytes8 c__69457152) internal pure returns (bool)
```

### Snapshots

```solidity
struct Snapshots {
  uint256[] ids;
  uint256[] values;
}
```

### Snapshot

```solidity
event Snapshot(uint256 id)
```

_Emitted by {_snapshot} when a snapshot identified by `id` is created._

### _snapshot

```solidity
function _snapshot() internal virtual returns (uint256)
```

_Creates a new snapshot and returns its snapshot id.

Emits a {Snapshot} event that contains the same id.

{_snapshot} is `internal` and you have to decide how to expose it externally. Its usage may be restricted to a
set of accounts, for example using {AccessControl}, or it may be open to the public.

[WARNING]
====
While an open way of calling {_snapshot} is required for certain trust minimization mechanisms such as forking,
you must consider that it can potentially be used by attackers in two ways.

First, it can be used to increase the cost of retrieval of values from snapshots, although it will grow
logarithmically thus rendering this attack ineffective in the long term. Second, it can be used to target
specific accounts and increase the cost of ERC20 transfers for them, in the ways specified in the Gas Costs
section above.

We haven't measured the actual numbers; if this is something you're interested in please reach out to us.
====_

### _getCurrentSnapshotId

```solidity
function _getCurrentSnapshotId() internal view virtual returns (uint256)
```

_Get the current snapshotId_

### balanceOfAt

```solidity
function balanceOfAt(address account, uint256 snapshotId) public view virtual returns (uint256)
```

_Retrieves the balance of `account` at the time `snapshotId` was created._

### totalSupplyAt

```solidity
function totalSupplyAt(uint256 snapshotId) public view virtual returns (uint256)
```

_Retrieves the total supply at the time `snapshotId` was created._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual returns (uint256)
```

_Hook that is called before any transfer of tokens. This includes
minting and burning.

If the token is not paused, it will pass through the amount_

### _valueAt

```solidity
function _valueAt(uint256 snapshotId, struct VoteSnapshots.Snapshots snapshots) internal view returns (bool, uint256)
```

### _updateSnapshot

```solidity
function _updateSnapshot(struct VoteSnapshots.Snapshots snapshots, uint256 currentValue) internal
```

