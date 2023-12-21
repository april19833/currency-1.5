# Eco Association

Copyright (c) 2023 Eco Association

## TrustedNodes

**TrustedNodes**

A registry of trusted nodes. Trusted nodes (trustees) are able to vote
on monetary policy and can only be added or removed using community
governance.

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

address with the currencyGovernance role

```solidity
contract CurrencyGovernance currencyGovernance
```

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

voting record of each trustee

```solidity
mapping(address => uint256) votingRecord
```

### voteReward

reward earned per completed and revealed vote

```solidity
uint256 voteReward
```

### GovernanceOnlyFunction

```solidity
error GovernanceOnlyFunction()
```

### NodeAlreadyTrusted

Redundant node trusting error
error for when an already trusted node tries to be trusted again

```solidity
error NodeAlreadyTrusted(uint256 trusteeNumber)
```
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

Event emitted when a node added to a list of trusted nodes.

```solidity
event TrustedNodeAddition(address trustee)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the trustee being added |

### TrustedNodeRemoval

Event emitted when a node removed from a list of trusted nodes

```solidity
event TrustedNodeRemoval(address trustee)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the trustee being removed |

### VoteRecorded

Event emitted when a node removed from a list of trusted nodes

```solidity
event VoteRecorded(address trustee, uint256 newVotingRecord)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the trustee whose vote was recorded |
| newVotingRecord | uint256 | the new voting record for the trustee |

### VotingRewardRedemption

Event emitted when voting rewards are redeemed

```solidity
event VotingRewardRedemption(address recipient, uint256 amount)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | the address redeeming the rewards |
| amount | uint256 | the amount being redeemed |

### CurrencyGovernanceChanged

Event emitted when the currencyGovernance role changes

```solidity
event CurrencyGovernanceChanged(address newRoleHolder)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newRoleHolder | address | the new holder of the currencyGovernance role |

### onlyCurrencyGovernance

```solidity
modifier onlyCurrencyGovernance()
```

### constructor

Creates a new trusted node registry, populated with some initial nodes

```solidity
constructor(contract Policy _policy, contract CurrencyGovernance _currencyGovernance, contract ECOx _EcoX, uint256 _termLength, uint256 _voteReward, address[] _initialTrustees) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | the address of the root policy contract |
| _currencyGovernance | contract CurrencyGovernance | the address of the currencyGovernance contract |
| _EcoX | contract ECOx | the address of the EcoX contract |
| _termLength | uint256 | the length of the trustee term |
| _voteReward | uint256 | the reward awarded to a trustee for each successfully revealed vote |
| _initialTrustees | address[] | the initial cohort of trustees |

### getTrustees

```solidity
function getTrustees() public view returns (address[] _trustees)
```

### getLastWithdrawal

Fetches the date of a trustee's last withdrawal

```solidity
function getLastWithdrawal(address trustee) internal view returns (uint256 time)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the trustee whose last withdrawal date is being fetched |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| time | uint256 | the date of a trustee's last withdrawal |

### updateCurrencyGovernance

Changes the holder currencyGovernance role

```solidity
function updateCurrencyGovernance(contract CurrencyGovernance _currencyGovernance) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _currencyGovernance | contract CurrencyGovernance | the new currencyGovernance role holder |

### trust

Grant trust to a node.

The node is pushed to trustedNodes array.

```solidity
function trust(address _node) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | address | The node to start trusting. |

### _trust

Helper for trust

```solidity
function _trust(address _node) internal
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | address | The node to start trusting |

### distrust

Removes a trustee from the set
Node to distrust swaped to be a last element in the trustedNodes, then deleted

```solidity
function distrust(address _node) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | address | The trustee to be removed |

### recordVote

Incements the counter when the trustee reveals their vote

```solidity
function recordVote(address _who) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _who | address | address whose vote is being recorded |

### numTrustees

Return the number of entries in trustedNodes array.

```solidity
function numTrustees() external view returns (uint256)
```

### isTrusted

Checks if a node address is trusted in the current cohort

```solidity
function isTrusted(address _node) public view returns (bool)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | address | the address whose trustee status we want to check |

### withdraw

withdraws everything that can be withdrawn

```solidity
function withdraw() public
```

### currentlyWithdrawable

returns the amount of tokens that are currently withdrawable

```solidity
function currentlyWithdrawable() public view returns (uint256 amount)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | the amount of tokens that are currently withdrawable |

### calculateWithdrawal

helper for withdraw

```solidity
function calculateWithdrawal(address withdrawer) internal view returns (uint256 amount)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| withdrawer | address | the addres fo the withdrawer |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | the amount of withdrawals for the withdrawer |

### fullyVested

returns the number of tokens the sender is currently entitled to
which they will be able to withdraw upon vesting

```solidity
function fullyVested() public view returns (uint256 amount, uint256 timestamp)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | the amount of tokens the message sender will be entitled to when fully vested |
| timestamp | uint256 | the timestamp when the message sender will be fully vested |

### sweep

drains all the ECOx in TrustedNodes to a recipient address

```solidity
function sweep(address recipient) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | the address to receive the ECOx |

