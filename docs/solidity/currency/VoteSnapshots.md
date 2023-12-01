# Eco Association

Copyright (c) 2023 Eco Association

## VoteSnapshots

Extension of ERC20Delegated to support snapshotting.

This extension maintains a snapshot of each addresses's votes which updates on the transfer after a new snapshot is taken.
Only addresses that have opted into voting are snapshotted.

### Snapshot

```solidity
struct Snapshot {
  uint32 snapshotBlock;
  uint224 value;
}
```

### currentSnapshotBlock

the reference snapshotBlock that the update function checks against

```solidity
uint32 currentSnapshotBlock
```

### NewSnapshotBlock

Emitted by {_snapshot} when a new snapshot is created.

```solidity
event NewSnapshotBlock(uint256 block)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| block | uint256 | the new value of currentSnapshotBlock |

### constructor

Construct a new instance.

the root _policy needs to be passed down through to service ERC20BurnAndMint

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

### voteBalanceSnapshot

Retrieve the balance for the snapshot

```solidity
function voteBalanceSnapshot(address account) public view virtual returns (uint256 balance)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address to check vote balances for |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| balance | uint256 | the balance for the snapshot |

### totalSupplySnapshot

Retrieve the `totalSupply` for the snapshot

```solidity
function totalSupplySnapshot() public view virtual returns (uint256 totalSupply)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalSupply | uint256 | total supply for the current Snapshot |

### _snapshot

Creates a new snapshot and returns its snapshot id.

Emits a {NewSnapshotBlock} event that contains the same id.

```solidity
function _snapshot() internal virtual returns (uint256 snapshotId)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| snapshotId | uint256 | new snapshot idenitifier |

### _beforeTokenTransfer

Update total supply snapshots before the values are modified. This is implemented
in the _beforeTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual returns (uint256 totalSupplyAmount)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | the from address for the transfer |
| to | address | the to address for the transfer |
| amount | uint256 | the amount of the transfer |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalSupplyAmount | uint256 | the totalSupply ammount before the token transfer |

### _beforeVoteTokenTransfer

Update balance snapshots for votes before the values are modified. This is implemented
in the _beforeVoteTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.

```solidity
function _beforeVoteTokenTransfer(address from, address to, uint256 amount) internal virtual
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | the from address for the transfer |
| to | address | the to address for the transfer |
| amount | uint256 | the amount of the transfer |

