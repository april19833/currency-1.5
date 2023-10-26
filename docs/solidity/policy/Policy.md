# Eco Association
Copyright (c) 2023 Eco Association

## Policy

### setters

```solidity
mapping(bytes32 => bool) setters
```

### onlySetter

```solidity
modifier onlySetter(bytes32 _identifier)
```

### removeSelf

```solidity
function removeSelf(bytes32 _interfaceIdentifierHash) external
```

Remove the specified role from the contract calling this function.
This is for cleanup only, so if another contract has taken the
role, this does nothing.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _interfaceIdentifierHash | bytes32 | The interface identifier to remove from                                 the registry. |

### setPolicy

```solidity
function setPolicy(bytes32 _key, address _implementer, bytes32 _authKey) public
```

Set the policy label for a contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | bytes32 | The label to apply to the contract. |
| _implementer | address | The contract to assume the label. |
| _authKey | bytes32 |  |

### internalCommand

```solidity
function internalCommand(address _delegate, bytes32 _authKey) public
```

Enact the code of one of the governance contracts.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _delegate | address | The contract code to delegate execution to. |
| _authKey | bytes32 |  |

