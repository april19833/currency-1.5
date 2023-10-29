# Eco Association
Copyright (c) 2023 Eco Association

## Policy

### governors

```solidity
mapping(address => bool) governors
```

_mapping to store the contracts allowed to call functions_

### OnlyGovernors

```solidity
error OnlyGovernors()
```

_error for when an address tries submit proposal actions without permission_

### OnlySelf

```solidity
error OnlySelf()
```

_error for when an address tries to call a pseudo-internal function_

### FailedProposal

```solidity
error FailedProposal(address proposal)
```

for when a part of enacting a proposal reverts without a readable error

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal address that got reverted during enaction |

### UpdatedGovernors

```solidity
event UpdatedGovernors(address actor, bool newPermission)
```

emits when the governor permissions are changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actor | address | denotes the new address whose permissions are being updated |
| newPermission | bool | denotes the new ability of the actor address (true for can govern, false for cannot) |

### EnactedGovernanceProposal

```solidity
event EnactedGovernanceProposal(address proposal, address governor)
```

emits when enaction happens to keep record of enaction

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal address that got successfully enacted |
| governor | address | the contract which was the source of the proposal, source for looking up the calldata |

### onlyGovernorRole

```solidity
modifier onlyGovernorRole()
```

_Modifier for checking if the sender is a governor_

### onlySelf

```solidity
modifier onlySelf()
```

_Modifier for faux internal calls
needed for function to be called only during delegate call_

### updateGovernors

```solidity
function updateGovernors(address _key, bool _value) public
```

_change the governance permissions for an address
internal function_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can govern, false = cannot govern |

### enact

```solidity
function enact(address proposal) external virtual
```

