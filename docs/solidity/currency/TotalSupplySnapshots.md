# Eco Association

Copyright (c) 2023 Eco Association

## TotalSupplySnapshots

_Basic snapshotting just for total supply.

This extension maintains a snapshot the total supply which updates on mint or burn after a new snapshot is taken._

### Snapshot

```solidity
struct Snapshot {
  uint32 snapshotBlock;
  uint224 value;
}
```

### currentSnapshotBlock

```solidity
uint32 currentSnapshotBlock
```

### _totalSupplySnapshot

```solidity
struct TotalSupplySnapshots.Snapshot _totalSupplySnapshot
```

### NewSnapshotBlock

_Emitted by {_snapshot} when a new snapshot is created._

```solidity
event NewSnapshotBlock(uint256 block)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| block | uint256 | the new value of currentSnapshotBlock |

### constructor

```solidity
constructor(contract Policy _policy, string _name, string _symbol, address _initialPauser) internal
```

### initialize

Storage initialization of cloned contract

This is used to initialize the storage of the forwarded contract, and
should (typically) copy or repeat any work that would normally be
done in the constructor of the proxied contract.

Implementations of ForwardTarget should override this function,
and chain to super.initialize(_self).

```solidity
function initialize(address _self) public virtual
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | The address of the original contract instance (the one being              forwarded to). |

### totalSupplySnapshot

_Retrieve the `totalSupply` for the snapshot_

```solidity
function totalSupplySnapshot() public view virtual returns (uint256)
```

### _beforeTokenTransfer

Update total supply snapshots before the values are modified. This is implemented
in the _beforeTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual returns (uint256)
```

### _snapshot

_Creates a new snapshot and returns its snapshot id.

Emits a {NewSnapshotBlock} event that contains the same id._

```solidity
function _snapshot() internal virtual
```

