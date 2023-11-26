# Eco Association

Copyright (c) 2023 Eco Association

## VoteSnapshots

_Extension of ERC20Delegated to support snapshotting.

This extension maintains a snapshot of each addresses's votes which updates on the transfer after a new snapshot is taken.
Only addresses that have opted into voting are snapshotted._

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

### NewSnapshotBlock

  ```solidity
  event NewSnapshotBlock(uint256 block)
  ```

_Emitted by {_snapshot} when a new snapshot is created._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| block | uint256 | the new value of currentSnapshotBlock |

### constructor

  ```solidity
  constructor(contract Policy _policy, string _name, string _symbol, address _initialPauser) internal
  ```

Construct a new instance.

the root _policy needs to be passed down through to service ERC20BurnAndMint

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

### voteBalanceSnapshot

  ```solidity
  function voteBalanceSnapshot(address account) public view virtual returns (uint256)
  ```

_Retrieve the balance for the snapshot_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address to check vote balances for |

### totalSupplySnapshot

  ```solidity
  function totalSupplySnapshot() public view virtual returns (uint256)
  ```

_Retrieve the `totalSupply` for the snapshot_

### _snapshot

  ```solidity
  function _snapshot() internal virtual returns (uint256)
  ```

_Creates a new snapshot and returns its snapshot id.

Emits a {NewSnapshotBlock} event that contains the same id._

### _beforeTokenTransfer

  ```solidity
  function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual returns (uint256)
  ```

Update total supply snapshots before the values are modified. This is implemented
in the _beforeTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.

### _beforeVoteTokenTransfer

  ```solidity
  function _beforeVoteTokenTransfer(address from, address to, uint256 amount) internal virtual
  ```

Update balance snapshots for votes before the values are modified. This is implemented
in the _beforeVoteTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.

