# Eco Association

Copyright (c) 2023 Eco Association

## ECOx

**An ERC20 token interface for ECOx**

### snapshotters

_Mapping storing contracts able to rebase the token_

```solidity
mapping(address => bool) snapshotters
```

### TransferFailed

error for when transfer returns false
used by contracts that import this contract

```solidity
error TransferFailed()
```

### OnlySnapshotters

error for when an address tries to snapshot without permission

```solidity
error OnlySnapshotters()
```

### UpdatedSnapshotters

emits when the snapshotters permissions are changed

```solidity
event UpdatedSnapshotters(address actor, bool newPermission)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can snapshot, false for cannot) |

### onlySnapshotterRole

_Modifier for checking if the sender is a snapshotter_

```solidity
modifier onlySnapshotterRole()
```

### constructor

```solidity
constructor(contract Policy _policy, address _pauser) public
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

### snapshot

```solidity
function snapshot() public
```

### updateSnapshotters

_change the rebasing permissions for an address
only callable by tokenRoleAdmin_

```solidity
function updateSnapshotters(address _key, bool _value) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can snapshot, false = cannot snapshot |

