# Eco Association

Copyright (c) 2023 Eco Association

## TrustedNodes

**TrustedNodes

A registry of trusted nodes. Trusted nodes (trustees) are able to vote
on monetary policy and can only be added or removed using community
governance.**

### GENERATION_TIME

  ```solidity
  uint256 GENERATION_TIME
  ```

### termEnd

  ```solidity
  uint256 termEnd
  ```

### termLength

  ```solidity
  uint256 termLength
  ```

### currencyGovernance

  ```solidity
  contract CurrencyGovernance currencyGovernance
  ```

address with the currencyGovernance role

### ecoX

  ```solidity
  contract ECOx ecoX
  ```

### trusteeNumbers

  ```solidity
  mapping(address => uint256) trusteeNumbers
  ```

### trustees

  ```solidity
  address[] trustees
  ```

### votingRecord

  ```solidity
  mapping(address => uint256) votingRecord
  ```

voting record of each trustee

### voteReward

  ```solidity
  uint256 voteReward
  ```

reward earned per completed and revealed vote

### GovernanceOnlyFunction

  ```solidity
  error GovernanceOnlyFunction()
  ```

### NodeAlreadyTrusted

  ```solidity
  error NodeAlreadyTrusted(uint256 trusteeNumber)
  ```

Redundant node trusting error
error for when an already trusted node tries to be trusted again

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trusteeNumber | uint256 | the existing trustee number for the address |

### DistrustNotTrusted

  ```solidity
  error DistrustNotTrusted()
  ```

### WithdrawNoTokens

  ```solidity
  error WithdrawNoTokens()
  ```

### TrustedNodeAddition

  ```solidity
  event TrustedNodeAddition(address trustee)
  ```

Event emitted when a node added to a list of trusted nodes.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the trustee being added |

### TrustedNodeRemoval

  ```solidity
  event TrustedNodeRemoval(address trustee)
  ```

Event emitted when a node removed from a list of trusted nodes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the trustee being removed |

### VoteRecorded

  ```solidity
  event VoteRecorded(address trustee, uint256 newVotingRecord)
  ```

Event emitted when a node removed from a list of trusted nodes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the trustee whose vote was recorded |
| newVotingRecord | uint256 | the new voting record for the trustee |

### VotingRewardRedemption

  ```solidity
  event VotingRewardRedemption(address recipient, uint256 amount)
  ```

Event emitted when voting rewards are redeemed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | the address redeeming the rewards |
| amount | uint256 | the amount being redeemed |

### CurrencyGovernanceChanged

  ```solidity
  event CurrencyGovernanceChanged(address newRoleHolder)
  ```

Event emitted when the currencyGovernance role changes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newRoleHolder | address | the new holder of the currencyGovernance role |

### onlyCurrencyGovernance

  ```solidity
  modifier onlyCurrencyGovernance()
  ```

### constructor

  ```solidity
  constructor(contract Policy _policy, contract CurrencyGovernance _currencyGovernance, contract ECOx _EcoX, uint256 _termLength, uint256 _voteReward, address[] _initialTrustees) public
  ```

Creates a new trusted node registry, populated with some initial nodes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | the address of the root policy contract |
| _currencyGovernance | contract CurrencyGovernance | the address of the currencyGovernance contract |
| _EcoX | contract ECOx | the address of the EcoX contract |
| _termLength | uint256 | the length of the trustee term |
| _voteReward | uint256 | the reward awarded to a trustee for each successfully revealed vote |
| _initialTrustees | address[] | the initial cohort of trustees |

### getLastWithdrawal

  ```solidity
  function getLastWithdrawal(address trustee) internal view returns (uint256 time)
  ```

Fetches the date of a trustee's last withdrawal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the trustee whose last withdrawal date is being fetched |

### updateCurrencyGovernance

  ```solidity
  function updateCurrencyGovernance(contract CurrencyGovernance _currencyGovernance) public
  ```

Changes the holder currencyGovernance role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _currencyGovernance | contract CurrencyGovernance | the new currencyGovernance role holder |

### trust

  ```solidity
  function trust(address _node) external
  ```

Grant trust to a node.

The node is pushed to trustedNodes array.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | address | The node to start trusting. |

### _trust

  ```solidity
  function _trust(address _node) internal
  ```

Helper for trust

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | address | The node to start trusting |

### distrust

  ```solidity
  function distrust(address _node) external
  ```

Removes a trustee from the set
Node to distrust swaped to be a last element in the trustedNodes, then deleted

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | address | The trustee to be removed |

### recordVote

  ```solidity
  function recordVote(address _who) external
  ```

Incements the counter when the trustee reveals their vote

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _who | address | address whose vote is being recorded |

### numTrustees

  ```solidity
  function numTrustees() external view returns (uint256)
  ```

Return the number of entries in trustedNodes array.

### isTrusted

  ```solidity
  function isTrusted(address _node) public view returns (bool)
  ```

Checks if a node address is trusted in the current cohort

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | address | the address whose trustee status we want to check |

### withdraw

  ```solidity
  function withdraw() public
  ```

withdraws everything that can be withdrawn

### currentlyWithdrawable

  ```solidity
  function currentlyWithdrawable() public view returns (uint256 amount)
  ```

returns the amount of tokens that are currently withdrawable

### calculateWithdrawal

  ```solidity
  function calculateWithdrawal(address withdrawer) internal view returns (uint256 amount)
  ```

helper for withdraw

### fullyVested

  ```solidity
  function fullyVested() public view returns (uint256 amount, uint256 timestamp)
  ```

returns the number of tokens the sender is currently entitled to
which they will be able to withdraw upon vesting

### sweep

  ```solidity
  function sweep(address recipient) public
  ```

drains all the ECOx in TrustedNodes to a recipient address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | the address to receive the ECOx |

