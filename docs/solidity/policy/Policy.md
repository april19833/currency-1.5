# Eco Association

Copyright (c) 2023 Eco Association

## Policy

### governor

```solidity
address governor
```

_the contract allowed enact proposals_

### OnlyGovernor

```solidity
error OnlyGovernor()
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

### UpdatedGovernor

```solidity
event UpdatedGovernor(address oldGovernor, address newGovernor)
```

emits when the governor permissions are changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oldGovernor | address | denotes the old address whose permissions are being removed |
| newGovernor | address | denotes the new address whose permissions are being added |

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

### updateGovernor

```solidity
function updateGovernor(address _newGovernor) public
```

_pass the governance permissions to another address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newGovernor | address | the address to make the new governor |

### enact

```solidity
function enact(address proposal) external virtual
```

