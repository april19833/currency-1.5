# Eco Association

Copyright (c) 2023 Eco Association

## ERC20MintAndBurn

### minters

```solidity
mapping(address => bool) minters
```

_Mapping storing contracts able to mint tokens_

### burners

```solidity
mapping(address => bool) burners
```

_Mapping storing contracts able to burn tokens_

### OnlyMinters

```solidity
error OnlyMinters()
```

_error for when an address tries to mint tokens without permission_

### OnlyBurners

```solidity
error OnlyBurners()
```

_error for when an address tries to burn tokens without permission_

### UpdatedMinters

```solidity
event UpdatedMinters(address actor, bool newPermission)
```

emits when the minters permissions are changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can mint, false for cannot) |

### UpdatedBurners

```solidity
event UpdatedBurners(address actor, bool newPermission)
```

emits when the burners permissions are changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can burn, false for cannot) |

### onlyMinterRole

```solidity
modifier onlyMinterRole()
```

_Modifier for checking if the sender is a minter_

### onlyBurnerRoleOrSelf

```solidity
modifier onlyBurnerRoleOrSelf(address _from)
```

_Modifier for checking if the sender is allowed to burn
both burners and the message sender can burn_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | the address burning tokens |

### constructor

```solidity
constructor(contract Policy policy, string name, string ticker, address pauser) public
```

### updateMinters

```solidity
function updateMinters(address _key, bool _value) public
```

_change the minting permissions for an address
only callable by tokenRoleAdmin_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can mint, false = cannot mint |

### updateBurners

```solidity
function updateBurners(address _key, bool _value) public
```

_change the burning permissions for an address
only callable by tokenRoleAdmin_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can burn, false = cannot burn |

### mint

```solidity
function mint(address _to, uint256 _value) external
```

_mints tokens to a given address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | the address receiving tokens |
| _value | uint256 | the amount of tokens being minted |

### burn

```solidity
function burn(address _from, uint256 _value) external
```

_burns tokens to a given address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | the address whose tokens are being burned |
| _value | uint256 | the amount of tokens being burned |

