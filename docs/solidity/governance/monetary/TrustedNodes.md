# TrustedNodes



> TrustedNodes A registry of trusted nodes. Trusted nodes (trustees) are able to vote on monetary policy and can only be added or removed using community governance.





## Methods

### GENERATION_TIME

```solidity
function GENERATION_TIME() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### currencyGovernance

```solidity
function currencyGovernance() external view returns (contract CurrencyGovernance)
```

address with the currencyGovernance role 




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract CurrencyGovernance | undefined |

### currentlyWithdrawable

```solidity
function currentlyWithdrawable() external view returns (uint256 amount)
```

returns the amount of tokens that are currently withdrawable




#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### distrust

```solidity
function distrust(address _node) external nonpayable
```

Removes a trustee from the set Node to distrust swaped to be a last element in the trustedNodes, then deleted



#### Parameters

| Name | Type | Description |
|---|---|---|
| _node | address | The trustee to be removed |

### ecoX

```solidity
function ecoX() external view returns (contract ECOx)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ECOx | undefined |

### fullyVested

```solidity
function fullyVested() external view returns (uint256 amount, uint256 timestamp)
```

returns the number of tokens the sender is currently entitled to which they will be able to withdraw upon vesting




#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |
| timestamp | uint256 | undefined |

### implementation

```solidity
function implementation() external view returns (address _impl)
```

Get the address of the proxy target contract.




#### Returns

| Name | Type | Description |
|---|---|---|
| _impl | address | undefined |

### initialize

```solidity
function initialize(address _self) external nonpayable
```

Storage initialization of cloned contract This is used to initialize the storage of the forwarded contract, and should (typically) copy or repeat any work that would normally be done in the constructor of the proxied contract. Implementations of ForwardTarget should override this function, and chain to super.initialize(_self).



#### Parameters

| Name | Type | Description |
|---|---|---|
| _self | address | The address of the original contract instance (the one being              forwarded to). |

### isTrusted

```solidity
function isTrusted(address _node) external view returns (bool)
```

Checks if a node address is trusted in the current cohort



#### Parameters

| Name | Type | Description |
|---|---|---|
| _node | address | the address whose trustee status we want to check |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### numTrustees

```solidity
function numTrustees() external view returns (uint256)
```

Return the number of entries in trustedNodes array.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### policy

```solidity
function policy() external view returns (contract Policy)
```

The address of the root policy instance overseeing this instance. This address can be used for ERC1820 lookup of other components, ERC1820 lookup of role policies, and interaction with the policy hierarchy.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Policy | undefined |

### recordVote

```solidity
function recordVote(address _who) external nonpayable
```

Incements the counter when the trustee reveals their vote



#### Parameters

| Name | Type | Description |
|---|---|---|
| _who | address | address whose vote is being recorded |

### sweep

```solidity
function sweep(address recipient) external nonpayable
```

drains all the ECOx in TrustedNodes to a recipient address



#### Parameters

| Name | Type | Description |
|---|---|---|
| recipient | address | the address to receive the ECOx |

### termEnd

```solidity
function termEnd() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### termLength

```solidity
function termLength() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### trust

```solidity
function trust(address _node) external nonpayable
```

Grant trust to a node. The node is pushed to trustedNodes array.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _node | address | The node to start trusting. |

### trusteeNumbers

```solidity
function trusteeNumbers(address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### trustees

```solidity
function trustees(uint256) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### updateCurrencyGovernance

```solidity
function updateCurrencyGovernance(contract CurrencyGovernance _currencyGovernance) external nonpayable
```

Changes the holder currencyGovernance role



#### Parameters

| Name | Type | Description |
|---|---|---|
| _currencyGovernance | contract CurrencyGovernance | the new currencyGovernance role holder |

### voteReward

```solidity
function voteReward() external view returns (uint256)
```

reward earned per completed and revealed vote




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### votingRecord

```solidity
function votingRecord(address) external view returns (uint256)
```

voting record of each trustee



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### withdraw

```solidity
function withdraw() external nonpayable
```

withdraws everything that can be withdrawn






## Events

### CurrencyGovernanceChanged

```solidity
event CurrencyGovernanceChanged(address newRoleHolder)
```

Event emitted when the currencyGovernance role changes



#### Parameters

| Name | Type | Description |
|---|---|---|
| newRoleHolder  | address | the new holder of the currencyGovernance role |

### NewPolicy

```solidity
event NewPolicy(contract Policy newPolicy, contract Policy oldPolicy)
```

emits when the policy contract is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| newPolicy  | contract Policy | undefined |
| oldPolicy  | contract Policy | undefined |

### TrustedNodeAddition

```solidity
event TrustedNodeAddition(address indexed trustee)
```

Event emitted when a node added to a list of trusted nodes.



#### Parameters

| Name | Type | Description |
|---|---|---|
| trustee `indexed` | address | the trustee being added |

### TrustedNodeRemoval

```solidity
event TrustedNodeRemoval(address indexed trustee)
```

Event emitted when a node removed from a list of trusted nodes



#### Parameters

| Name | Type | Description |
|---|---|---|
| trustee `indexed` | address | the trustee being removed |

### VoteRecorded

```solidity
event VoteRecorded(address indexed trustee, uint256 newVotingRecord)
```

Event emitted when a node removed from a list of trusted nodes



#### Parameters

| Name | Type | Description |
|---|---|---|
| trustee `indexed` | address | the trustee whose vote was recorded |
| newVotingRecord  | uint256 | the new voting record for the trustee |

### VotingRewardRedemption

```solidity
event VotingRewardRedemption(address indexed recipient, uint256 amount)
```

Event emitted when voting rewards are redeemed



#### Parameters

| Name | Type | Description |
|---|---|---|
| recipient `indexed` | address | the address redeeming the rewards |
| amount  | uint256 | the amount being redeemed |



## Errors

### DistrustNotTrusted

```solidity
error DistrustNotTrusted()
```






### GovernanceOnlyFunction

```solidity
error GovernanceOnlyFunction()
```






### NodeAlreadyTrusted

```solidity
error NodeAlreadyTrusted(uint256 trusteeNumber)
```

Redundant node trusting error error for when an already trusted node tries to be trusted again



#### Parameters

| Name | Type | Description |
|---|---|---|
| trusteeNumber | uint256 | the existing trustee number for the address |

### NonZeroPolicyAddr

```solidity
error NonZeroPolicyAddr()
```






### PolicyOnlyFunction

```solidity
error PolicyOnlyFunction()
```






### TransferFailed

```solidity
error TransferFailed()
```



*error for when transfer returns false used by contracts that import this contract*


### WithdrawNoTokens

```solidity
error WithdrawNoTokens()
```







