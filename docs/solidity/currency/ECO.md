# Eco Association

Copyright (c) 2023 Eco Association

## ECO

**An ERC20 token interface to the Eco currency system.**

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

_error for when an address tries to rebase without permission_

### OnlySnapshotters

  ```solidity
  error OnlySnapshotters()
  ```

_error for when an address tries to snapshot without permission_

### UpdatedRebasers

  ```solidity
  event UpdatedRebasers(address actor, bool newPermission)
  ```

_emits when the rebasers permissions are changed_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can rebase, false for cannot) |

### UpdatedSnapshotters

  ```solidity
  event UpdatedSnapshotters(address actor, bool newPermission)
  ```

_emits when the snapshotters permissions are changed_

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

_Initialize_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | the address to initialize |

### rebase

  ```solidity
  function rebase(uint256 _inflationMultiplier) public
  ```

_Rebase the currency using an inflation multiplier_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _inflationMultiplier | uint256 | the multipler used to rebase the currency |

### snapshot

  ```solidity
  function snapshot() public
  ```

_Creates a new snapshot_

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

