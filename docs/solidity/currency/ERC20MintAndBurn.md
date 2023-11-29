# Eco Association

Copyright (c) 2023 Eco Association

## ERC20MintAndBurn

**An ERC20 token interface for ECOx**

### minters

Mapping storing contracts able to mint tokens

  ```solidity
  mapping(address => bool) minters
  ```

### burners

Mapping storing contracts able to burn tokens

  ```solidity
  mapping(address => bool) burners
  ```

### OnlyMinters

error for when an address tries to mint tokens without permission

  ```solidity
  error OnlyMinters()
  ```

### OnlyBurners

error for when an address tries to burn tokens without permission

  ```solidity
  error OnlyBurners()
  ```

### UpdatedMinters

emits when the minters permissions are changed

  ```solidity
  event UpdatedMinters(address actor, bool newPermission)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can mint, false for cannot) |

### UpdatedBurners

emits when the burners permissions are changed

  ```solidity
  event UpdatedBurners(address actor, bool newPermission)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can burn, false for cannot) |

### onlyMinterRole

Modifier for checking if the sender is a minter

  ```solidity
  modifier onlyMinterRole()
  ```

### onlyBurnerRoleOrSelf

Modifier for checking if the sender is allowed to burn
both burners and the message sender can burn

  ```solidity
  modifier onlyBurnerRoleOrSelf(address _from)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | the address burning tokens |

### constructor

  ```solidity
  constructor(contract Policy policy, string name, string ticker, address pauser) public
  ```

### updateMinters

change the minting permissions for an address
only callable by tokenRoleAdmin

  ```solidity
  function updateMinters(address _key, bool _value) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can mint, false = cannot mint |

### updateBurners

change the burning permissions for an address
only callable by tokenRoleAdmin

  ```solidity
  function updateBurners(address _key, bool _value) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can burn, false = cannot burn |

### mint

mints tokens to a given address

  ```solidity
  function mint(address _to, uint256 _value) external
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | the address receiving tokens |
| _value | uint256 | the amount of tokens being minted |

### burn

burns tokens to a given address

  ```solidity
  function burn(address _from, uint256 _value) external
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | the address whose tokens are being burned |
| _value | uint256 | the amount of tokens being burned |

