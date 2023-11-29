# Eco Association

Copyright (c) 2023 Eco Association

## Policy

**The policy contract that oversees other contracts**

Policy contracts provide a mechanism for building pluggable (after deploy)
governance systems for other contracts.

### governor

the contract allowed enact proposals

  ```solidity
  address governor
  ```

### OnlyGovernor

error for when an address tries submit proposal actions without permission

  ```solidity
  error OnlyGovernor()
  ```

### OnlySelf

error for when an address tries to call a pseudo-internal function

  ```solidity
  error OnlySelf()
  ```

### FailedProposal

for when a part of enacting a proposal reverts without a readable error

  ```solidity
  error FailedProposal(address proposal)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal address that got reverted during enaction |

### UpdatedGovernor

emits when the governor permissions are changed

  ```solidity
  event UpdatedGovernor(address oldGovernor, address newGovernor)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oldGovernor | address | denotes the old address whose permissions are being removed |
| newGovernor | address | denotes the new address whose permissions are being added |

### EnactedGovernanceProposal

emits when enaction happens to keep record of enaction

  ```solidity
  event EnactedGovernanceProposal(address proposal, address governor)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal address that got successfully enacted |
| governor | address | the contract which was the source of the proposal, source for looking up the calldata |

### onlyGovernorRole

Modifier for checking if the sender is a governor

  ```solidity
  modifier onlyGovernorRole()
  ```

### onlySelf

Modifier for faux internal calls
needed for function to be called only during delegate call

  ```solidity
  modifier onlySelf()
  ```

### constructor

  ```solidity
  constructor(address _governor) public
  ```

### initialize

initializes the governor

  ```solidity
  function initialize(address _self) public virtual
  ```

### updateGovernor

pass the governance permissions to another address

  ```solidity
  function updateGovernor(address _newGovernor) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newGovernor | address | the address to make the new governor |

### enact

  ```solidity
  function enact(address proposal) external virtual
  ```

