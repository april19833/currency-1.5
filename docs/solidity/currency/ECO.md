# Eco Association

Copyright (c) 2023 Eco Association

## ECO

### rebasers

```solidity
mapping(address => bool) rebasers
```

_Mapping storing contracts able to rebase the token_

### snapshotters

```solidity
mapping(address => bool) snapshotters
```

_Mapping storing contracts able to rebase the token_

### OnlyRebasers

```solidity
error OnlyRebasers()
```

error for when an address tries to rebase without permission

### OnlySnapshotters

```solidity
error OnlySnapshotters()
```

error for when an address tries to snapshot without permission

### UpdatedRebasers

```solidity
event UpdatedRebasers(address actor, bool newPermission)
```

emits when the rebasers permissions are changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can rebase, false for cannot) |

### UpdatedSnapshotters

```solidity
event UpdatedSnapshotters(address actor, bool newPermission)
```

emits when the snapshotters permissions are changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can snapshot, false for cannot) |

### onlyRebaserRole

```solidity
modifier onlyRebaserRole()
```

_Modifier for checking if the sender is a rebaser_

### onlySnapshotterRole

```solidity
modifier onlySnapshotterRole()
```

_Modifier for checking if the sender is a snapshotter_

### constructor

```solidity
constructor(contract Policy _policy, address _initialPauser) public
```

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

### rebase

```solidity
function rebase(uint256 _inflationMultiplier) public
```

### snapshot

```solidity
function snapshot() public
```

### updateRebasers

```solidity
function updateRebasers(address _key, bool _value) public
```

_change the rebasing permissions for an address
only callable by tokenRoleAdmin_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can rebase, false = cannot rebase |

### updateSnapshotters

```solidity
function updateSnapshotters(address _key, bool _value) public
```

_change the rebasing permissions for an address
only callable by tokenRoleAdmin_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can snapshot, false = cannot snapshot |

