# Eco Association

Copyright (c) 2023 Eco Association

## ECO

**An ERC20 token interface to the Eco currency system.**

### rebasers

Mapping storing contracts able to rebase the token

```solidity
mapping(address => bool) rebasers
```

### snapshotters

Mapping storing contracts able to rebase the token

```solidity
mapping(address => bool) snapshotters
```

### OnlyRebasers

error for when an address tries to rebase without permission

```solidity
error OnlyRebasers()
```

### OnlySnapshotters

error for when an address tries to snapshot without permission

```solidity
error OnlySnapshotters()
```

### UpdatedRebasers

emits when the rebasers permissions are changed

```solidity
event UpdatedRebasers(address actor, bool newPermission)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can rebase, false for cannot) |

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

### onlyRebaserRole

Modifier for checking if the sender is a rebaser

```solidity
modifier onlyRebaserRole()
```

### onlySnapshotterRole

Modifier for checking if the sender is a snapshotter

```solidity
modifier onlySnapshotterRole()
```

### constructor

```solidity
constructor(contract Policy _policy, address _initialPauser) public
```

### initialize

Initialize

```solidity
function initialize(address _self) public virtual
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | the address to initialize |

### rebase

Rebase the currency using an inflation multiplier

```solidity
function rebase(uint256 _inflationMultiplier) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _inflationMultiplier | uint256 | the multipler used to rebase the currency |

### snapshot

Creates a new snapshot

```solidity
function snapshot() public
```

### updateRebasers

change the rebasing permissions for an address
only callable by tokenRoleAdmin

```solidity
function updateRebasers(address _key, bool _value) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can rebase, false = cannot rebase |

### updateSnapshotters

change the rebasing permissions for an address
only callable by tokenRoleAdmin

```solidity
function updateSnapshotters(address _key, bool _value) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can snapshot, false = cannot snapshot |

