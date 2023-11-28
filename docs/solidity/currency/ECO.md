# Eco Association

Copyright (c) 2023 Eco Association

## ECO

**An ERC20 token interface to the Eco currency system.**

### rebasers

_Mapping storing contracts able to rebase the token_

  ```solidity
  mapping(address => bool) rebasers
  ```

### snapshotters

_Mapping storing contracts able to rebase the token_

  ```solidity
  mapping(address => bool) snapshotters
  ```

### OnlyRebasers

_error for when an address tries to rebase without permission_

  ```solidity
  error OnlyRebasers()
  ```

### OnlySnapshotters

_error for when an address tries to snapshot without permission_

  ```solidity
  error OnlySnapshotters()
  ```

### UpdatedRebasers

_emits when the rebasers permissions are changed_

  ```solidity
  event UpdatedRebasers(address actor, bool newPermission)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can rebase, false for cannot) |

### UpdatedSnapshotters

_emits when the snapshotters permissions are changed_

  ```solidity
  event UpdatedSnapshotters(address actor, bool newPermission)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can snapshot, false for cannot) |

### onlyRebaserRole

_Modifier for checking if the sender is a rebaser_

  ```solidity
  modifier onlyRebaserRole()
  ```

### onlySnapshotterRole

_Modifier for checking if the sender is a snapshotter_

  ```solidity
  modifier onlySnapshotterRole()
  ```

### constructor

  ```solidity
  constructor(contract Policy _policy, address _initialPauser) public
  ```

### initialize

_Initialize_

  ```solidity
  function initialize(address _self) public virtual
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | the address to initialize |

### rebase

_Rebase the currency using an inflation multiplier_

  ```solidity
  function rebase(uint256 _inflationMultiplier) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _inflationMultiplier | uint256 | the multipler used to rebase the currency |

### snapshot

_Creates a new snapshot_

  ```solidity
  function snapshot() public
  ```

### updateRebasers

_change the rebasing permissions for an address
only callable by tokenRoleAdmin_

  ```solidity
  function updateRebasers(address _key, bool _value) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can rebase, false = cannot rebase |

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

