# Eco Association

Copyright (c) 2023 Eco Association

## PolicyProposals

### PropData

```solidity
struct PropData {
  struct PolicyProposals.PropMetadata metadata;
  mapping(address => bool) staked;
}
```

### PropMetadata

```solidity
struct PropMetadata {
  address proposer;
  contract Proposal proposal;
  uint256 totalStake;
  bool feeWaived;
}
```

### proposals

```solidity
mapping(contract Proposal => struct PolicyProposals.PropData) proposals
```

The set of proposals under consideration.
maps from addresses of proposals to structs containing with info and
the staking data (structs defined above)

### totalProposals

```solidity
uint256 totalProposals
```

The total number of proposals made.

### PROPOSAL_TIME

```solidity
uint256 PROPOSAL_TIME
```

The duration of the proposal portion of the proposal phase.

### proposalSelected

```solidity
bool proposalSelected
```

Whether or not a winning proposal has been selected

### proposalToConfigure

```solidity
contract Proposal proposalToConfigure
```

Selected proposal awaiting configuration before voting

### COST_REGISTER

```solidity
uint256 COST_REGISTER
```

The minimum cost to register a proposal.

### REFUND_IF_LOST

```solidity
uint256 REFUND_IF_LOST
```

The amount refunded if a proposal does not get selected.

### SUPPORT_THRESHOLD

```solidity
uint256 SUPPORT_THRESHOLD
```

The percentage of total voting power required to push to a vote.

### SUPPORT_THRESHOLD_DIVISOR

```solidity
uint256 SUPPORT_THRESHOLD_DIVISOR
```

The divisor for the above constant, tracks the digits of precision.

### totalVotingThreshold

```solidity
uint256 totalVotingThreshold
```

The total voting value against which to compare for the threshold
This is a fixed digit number with 2 decimal digits
see SUPPORT_THRESHOLD_DIVISOR variable

### proposalEnds

```solidity
uint256 proposalEnds
```

The time at which the proposal portion of the proposals phase ends.

### blockNumber

```solidity
uint256 blockNumber
```

The block number of the balance stores to use for staking in
support of a proposal.

### policyVotesImpl

```solidity
contract PolicyVotes policyVotesImpl
```

The address of the `PolicyVotes` contract, to be cloned for the voting
phase.

### Register

```solidity
event Register(address proposer, contract Proposal proposalAddress)
```

An event indicating a proposal has been proposed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposer | address | The address that submitted the Proposal |
| proposalAddress | contract Proposal | The address of the Proposal contract instance that was added |

### Support

```solidity
event Support(address supporter, contract Proposal proposalAddress)
```

An event indicating that proposal have been supported by stake.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporter | address | The address submitting their support for the proposal |
| proposalAddress | contract Proposal | The address of the Proposal contract instance that was supported |

### Unsupport

```solidity
event Unsupport(address unsupporter, contract Proposal proposalAddress)
```

An event indicating that support has been removed from a proposal.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| unsupporter | address | The address removing their support for the proposal |
| proposalAddress | contract Proposal | The address of the Proposal contract instance that was unsupported |

### SupportThresholdReached

```solidity
event SupportThresholdReached(contract Proposal proposalAddress)
```

An event indicating a proposal has reached its support threshold

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposalAddress | contract Proposal | The address of the Proposal contract instance that reached the threshold. |

### VoteStart

```solidity
event VoteStart(contract PolicyVotes contractAddress)
```

An event indicating that a proposal has been accepted for voting

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contractAddress | contract PolicyVotes | The address of the PolicyVotes contract instance. |

### ProposalRefund

```solidity
event ProposalRefund(address proposer, contract Proposal proposalAddress)
```

An event indicating that proposal fee was partially refunded.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposer | address | The address of the proposee which was refunded |
| proposalAddress | contract Proposal | The address of the Proposal instance that was refunded |

### constructor

```solidity
constructor(contract Policy _policy, contract PolicyVotes _policyvotes, contract ECO _ecoAddr) public
```

Construct a new PolicyProposals instance using the provided supervising
policy (root) and supporting contracts.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | The address of the root policy contract. |
| _policyvotes | contract PolicyVotes | The address of the contract that will be cloned to                     oversee the voting phase. |
| _ecoAddr | contract ECO | The address of the ECO token contract. |

### initialize

```solidity
function initialize(address _self) public
```

Initialize the storage context using parameters copied from the original
contract (provided as _self).

Can only be called once, during proxy initialization.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | The original contract address. |

### registerProposal

```solidity
function registerProposal(contract Proposal _prop) external
```

Submit a proposal.

You must approve the policy proposals contract to withdraw the required
fee from your account before calling this.

Can only be called during the proposals portion of the proposals phase.
Each proposal may only be submitted once.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _prop | contract Proposal | The address of the proposal to submit. |

### support

```solidity
function support(contract Proposal _prop) external
```

Stake in support of an existing proposal.

Can only be called during the staking portion of the proposals phase.

Your voting strength is added to the supporting stake of the proposal.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _prop | contract Proposal | The proposal to support. |

### unsupport

```solidity
function unsupport(contract Proposal _prop) external
```

### deployProposalVoting

```solidity
function deployProposalVoting() external
```

### refund

```solidity
function refund(contract Proposal _prop) external
```

Refund the fee for a proposal that was not selected.

Returns a partial refund only, does not work on proposals that are
on the ballot for the voting phase, and can only be called after voting
been deployed or when the period is over and no vote was selected.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _prop | contract Proposal | The proposal to issue a refund for. |

### destruct

```solidity
function destruct() external
```

Reclaim tokens after end time
only callable if all proposals are refunded

### configure

```solidity
function configure(uint256 _totalECOxSnapshot, uint256 _excludedVotingPower) external
```

