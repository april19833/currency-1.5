# Eco Association

Copyright (c) 2023 Eco Association

## CommunityGovernance

### PropData

```solidity
struct PropData {
  uint256 cycle;
  address proposer;
  uint256 totalSupport;
  uint256 refund;
  mapping(address => uint256) support;
  mapping(address => uint256) enactVotes;
  mapping(address => uint256) rejectVotes;
  mapping(address => uint256) abstainVotes;
}
```

### Stage

```solidity
enum Stage {
  Done,
  Proposal,
  Voting,
  Delay,
  Execution
}
```

### Vote

```solidity
enum Vote {
  Reject,
  Enact,
  Abstain
}
```

### CYCLE_LENGTH

```solidity
uint256 CYCLE_LENGTH
```

the duration of the community governance cycle

### PROPOSAL_LENGTH

```solidity
uint256 PROPOSAL_LENGTH
```

the duration of the proposal stage

### VOTING_LENGTH

```solidity
uint256 VOTING_LENGTH
```

the duration of the voting stage

### DELAY_LENGTH

```solidity
uint256 DELAY_LENGTH
```

the duration of the execution delay

### pauser

```solidity
address pauser
```

address allowed to pause community governance

### proposals

```solidity
mapping(address => struct CommunityGovernance.PropData) proposals
```

reference any proposal by its address

### cycleCount

```solidity
uint256 cycleCount
```

number of voting cycles since launch

### cycleStart

```solidity
uint256 cycleStart
```

start of the current cycle

### stage

```solidity
enum CommunityGovernance.Stage stage
```

current stage in the cycle

### currentStageEnd

```solidity
uint256 currentStageEnd
```

end time of current

### snapshotBlock

```solidity
uint256 snapshotBlock
```

snapshot block for calculating voting power

### proposalFee

```solidity
uint256 proposalFee
```

cost in ECO to submit a proposal

### feeRefund

```solidity
uint256 feeRefund
```

proposal fee to be refunded if proposal is not enacted

### supportThresholdPercent

```solidity
uint256 supportThresholdPercent
```

the percent of total VP that must be supporting a proposal in order to advance it to the voting stage

### voteThresholdPercent

```solidity
uint256 voteThresholdPercent
```

the percent of total VP that must have voted to enact a proposal in order to bypass the delay period

### cycleTotalVotingPower

```solidity
uint256 cycleTotalVotingPower
```

total voting power for the cycle

### selectedProposal

```solidity
address selectedProposal
```

the proposal being voted on this cycle

### totalEnactVotes

```solidity
uint256 totalEnactVotes
```

total votes to enact the selected proposal

### totalRejectVotes

```solidity
uint256 totalRejectVotes
```

total votes to reject the selected proposal

### totalAbstainVotes

```solidity
uint256 totalAbstainVotes
```

total votes to abstain from voting on the selected proposal

### pot

```solidity
uint256 pot
```

redeemable tokens from fees

### OnlyPauser

```solidity
error OnlyPauser()
```

thrown when non-pauser tries to call pause without permission

### WrongStage

```solidity
error WrongStage()
```

thrown when a call is made during the wrong stage of Community Governance

### DuplicateProposal

```solidity
error DuplicateProposal()
```

thrown when a proposal that already exists is proposed again

### ArrayLengthMismatch

```solidity
error ArrayLengthMismatch()
```

thrown when related argument arrays have differing lengths

### BadVotingPower

```solidity
error BadVotingPower()
```

thrown when the voting power of a support or vote action is invalid

### NoSupportToRevoke

```solidity
error NoSupportToRevoke()
```

thrown when unsupport is called without the caller having supported the proposal

### BadVoteType

```solidity
error BadVoteType()
```

thrown when vote is called with a vote type other than enact, reject, abstain

### NoRefundAvailable

```solidity
error NoRefundAvailable(address proposal)
```

thrown when refund is called on a proposal for which no refund is available

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal whose refund was attempted |

### NoRefundDuringCycle

```solidity
error NoRefundDuringCycle(address proposal)
```

thrown when refund is called on a proposal that was submitted in the current cycle

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal whose refund was attempted |

### PauserAssignment

```solidity
event PauserAssignment(address pauser)
```

event indicating the pauser was updated

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pauser | address | The new pauser |

### StageUpdated

```solidity
event StageUpdated(enum CommunityGovernance.Stage stage)
```

event indicating a change in the community governance stage

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stage | enum CommunityGovernance.Stage | the new stage |

### ProposalRegistration

```solidity
event ProposalRegistration(address proposer, contract Proposal proposal)
```

An event indicating a proposal has been registered

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposer | address | The address that submitted the proposal |
| proposal | contract Proposal | The address of the proposal contract instance that was added |

### SupportChanged

```solidity
event SupportChanged(address supporter, contract Proposal proposal, uint256 oldSupport, uint256 newSupport)
```

An event indicating a change in support for a proposal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporter | address | The address that submitted the proposal |
| proposal | contract Proposal | The address of the proposal contract instance that was added |
| oldSupport | uint256 | The previous amount of support |
| newSupport | uint256 | The new amount of support |

### VotesChanged

```solidity
event VotesChanged(address voter, uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes)
```

An event indicating a vote cast on a proposal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| voter | address | The address casting votes |
| enactVotes | uint256 | The votes to enact |
| rejectVotes | uint256 | The votes to reject |
| abstainVotes | uint256 | The votes to abstain |

### ExecutionComplete

```solidity
event ExecutionComplete(address proposal)
```

An event indicating that the proposal selected for this governance cycle was successfully executed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | The proposal that was executed |

### NewCycle

```solidity
event NewCycle(uint256 cycleNumber)
```

An event indicating that a new cycle has begun

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| cycleNumber | uint256 | the cycle number |

### FeeRefunded

```solidity
event FeeRefunded(address proposal, address proposer, uint256 refund)
```

An event indicating that the fee for a proposal was refunded
     @param proposal The address of the proposal being refunded
     @param proposer The address that registered the proposal
     @param refund The amount of tokens refunded to proposer

### Sweep

```solidity
event Sweep(address recipient)
```

An event indicating that the leftover funds from fees were swept to a recipient address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | the recipient address |

### onlyPauser

```solidity
modifier onlyPauser()
```

### constructor

```solidity
constructor(contract Policy policy, contract ECO _eco, contract ECOxStaking _ecoXStaking, uint256 _cycleStart, address _pauser) public
```

contract constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| policy | contract Policy | the root policy address |
| _eco | contract ECO | the ECO contract address |
| _ecoXStaking | contract ECOxStaking | the ECOxStaking contract address |
| _cycleStart | uint256 | the time that the first cycle should begin |
| _pauser | address | the new pauser |

### setPauser

```solidity
function setPauser(address _pauser) public
```

sets the pauser of community governance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pauser | address | the new pauser |

### pause

```solidity
function pause() external
```

Pauses community governance

### updateStage

```solidity
function updateStage() public
```

updates the current stage

_called by methods propose, vote, and execute._

### nextCycle

```solidity
function nextCycle() internal
```

moves community governance to the next cycle

### propose

```solidity
function propose(contract Proposal _proposal) public
```

allows a user to submit a community governance proposal

_fee is only levied if community governance is paused - we want to still be usable
in the event that ECO transfers are paused._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposal | contract Proposal | the address of the deployed proposal |

### support

```solidity
function support(address _proposal) public
```

allows an address to register its full voting power in support of a proposal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposal | address | the address of proposal to be supported |

### supportPartial

```solidity
function supportPartial(address[] _proposals, uint256[] _allocations) public
```

allows an address to register partial support for a set of proposals

__changeSupport overwrites the previous supporting voting power, so having the same proposal multiple times in the _proposals array will not result in double counting of support_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposals | address[] | the array of proposals to be supported |
| _allocations | uint256[] | the respective voting power to put behind those proposals |

### unsupport

```solidity
function unsupport(address _proposal) public
```

allows an address to revoke support for a proposal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposal | address | the address of proposal to be supported |

### _changeSupport

```solidity
function _changeSupport(address supporter, address proposal, uint256 amount) internal
```

### getSupport

```solidity
function getSupport(address supporter, address proposal) public view returns (uint256 support)
```

fetches the voting power with which a given address supports a given proposal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporter | address | the supporting address |
| proposal | address | the proposal |

### vote

```solidity
function vote(enum CommunityGovernance.Vote choice) public
```

allows an address to vote to enact, reject or abstain on a proposal with their full voting power

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| choice | enum CommunityGovernance.Vote | the address' vote |

### votePartial

```solidity
function votePartial(uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes) public
```

allows an address to split their voting power allocation between enact, reject and abstain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| enactVotes | uint256 | votes to enact |
| rejectVotes | uint256 | votes to reject |
| abstainVotes | uint256 | votes to abstain |

### _vote

```solidity
function _vote(address voter, uint256 _enactVotes, uint256 _rejectVotes, uint256 _abstainVotes) internal
```

### getVotes

```solidity
function getVotes(address voter) public view returns (uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes)
```

fetches the votes an address has pledged toward enacting, rejecting, and abstaining on a given proposal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| voter | address | the supporting address |

### execute

```solidity
function execute() public
```

allows an address to enact a selected proposal that has passed the vote

_it is important to do this in a timely manner, once the cycle passes it will no longer be possible to execute the proposal.
the community will have a minimum of 3 days 8 hours to enact the proposal._

### refund

```solidity
function refund(address proposal) public
```

allows redemption of proposal registration fees

_the fee will be refunded to the proposer of the proposal, regardless of who calls refund_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal whose fee is being redeemed |

### sweep

```solidity
function sweep(address recipient) public
```

allows the leftover registration fees to be drained from the contract

_only the policy contract can call this_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | the address receiving the tokens |

