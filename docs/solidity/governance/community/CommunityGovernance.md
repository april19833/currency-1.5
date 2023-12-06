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

the duration of the community governance cycle

```solidity
uint256 CYCLE_LENGTH
```

### PROPOSAL_LENGTH

the duration of the proposal stage

```solidity
uint256 PROPOSAL_LENGTH
```

### VOTING_LENGTH

the duration of the voting stage

```solidity
uint256 VOTING_LENGTH
```

### DELAY_LENGTH

the duration of the execution delay

```solidity
uint256 DELAY_LENGTH
```

### pauser

address allowed to pause community governance

```solidity
address pauser
```

### proposals

reference any proposal by its address

```solidity
mapping(address => struct CommunityGovernance.PropData) proposals
```

### cycleCount

number of voting cycles since launch

```solidity
uint256 cycleCount
```

### cycleStart

start of the current cycle

```solidity
uint256 cycleStart
```

### stage

current stage in the cycle

```solidity
enum CommunityGovernance.Stage stage
```

### currentStageEnd

end time of current

```solidity
uint256 currentStageEnd
```

### snapshotBlock

snapshot block for calculating voting power

```solidity
uint256 snapshotBlock
```

### proposalFee

cost in ECO to submit a proposal

```solidity
uint256 proposalFee
```

### feeRefund

proposal fee to be refunded if proposal is not enacted

```solidity
uint256 feeRefund
```

### supportThresholdPercent

the percent of total VP that must be supporting a proposal in order to advance it to the voting stage

```solidity
uint256 supportThresholdPercent
```

### voteThresholdPercent

the percent of total VP that must have voted to enact a proposal in order to bypass the delay period

```solidity
uint256 voteThresholdPercent
```

### cycleTotalVotingPower

total voting power for the cycle

```solidity
uint256 cycleTotalVotingPower
```

### selectedProposal

the proposal being voted on this cycle

```solidity
address selectedProposal
```

### totalEnactVotes

total votes to enact the selected proposal

```solidity
uint256 totalEnactVotes
```

### totalRejectVotes

total votes to reject the selected proposal

```solidity
uint256 totalRejectVotes
```

### totalAbstainVotes

total votes to abstain from voting on the selected proposal

```solidity
uint256 totalAbstainVotes
```

### pot

redeemable tokens from fees

```solidity
uint256 pot
```

### OnlyPauser

thrown when non-pauser tries to call pause without permission

```solidity
error OnlyPauser()
```

### WrongStage

thrown when a call is made during the wrong stage of Community Governance

```solidity
error WrongStage()
```

### DuplicateProposal

thrown when a proposal that already exists is proposed again

```solidity
error DuplicateProposal()
```

### ArrayLengthMismatch

thrown when related argument arrays have differing lengths

```solidity
error ArrayLengthMismatch()
```

### BadVotingPower

thrown when the voting power of a support or vote action is invalid

```solidity
error BadVotingPower()
```

### NoSupportToRevoke

thrown when unsupport is called without the caller having supported the proposal

```solidity
error NoSupportToRevoke()
```

### BadVoteType

thrown when vote is called with a vote type other than enact, reject, abstain

```solidity
error BadVoteType()
```

### NoRefundAvailable

thrown when refund is called on a proposal for which no refund is available

```solidity
error NoRefundAvailable(address proposal)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal whose refund was attempted |

### NoRefundDuringCycle

thrown when refund is called on a proposal that was submitted in the current cycle

```solidity
error NoRefundDuringCycle(address proposal)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal whose refund was attempted |

### PauserAssignment

event indicating the pauser was updated

```solidity
event PauserAssignment(address pauser)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pauser | address | The new pauser |

### StageUpdated

event indicating a change in the community governance stage

```solidity
event StageUpdated(enum CommunityGovernance.Stage stage)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stage | enum CommunityGovernance.Stage | the new stage |

### ProposalRegistration

An event indicating a proposal has been registered

```solidity
event ProposalRegistration(address proposer, contract Proposal proposal)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposer | address | The address that submitted the proposal |
| proposal | contract Proposal | The address of the proposal contract instance that was added |

### SupportChanged

An event indicating a change in support for a proposal

```solidity
event SupportChanged(address supporter, contract Proposal proposal, uint256 oldSupport, uint256 newSupport)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporter | address | The address that submitted the proposal |
| proposal | contract Proposal | The address of the proposal contract instance that was added |
| oldSupport | uint256 | The previous amount of support |
| newSupport | uint256 | The new amount of support |

### VotesChanged

An event indicating a vote cast on a proposal

```solidity
event VotesChanged(address voter, uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| voter | address | The address casting votes |
| enactVotes | uint256 | The votes to enact |
| rejectVotes | uint256 | The votes to reject |
| abstainVotes | uint256 | The votes to abstain |

### ExecutionComplete

An event indicating that the proposal selected for this governance cycle was successfully executed

```solidity
event ExecutionComplete(address proposal)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | The proposal that was executed |

### NewCycle

An event indicating that a new cycle has begun

```solidity
event NewCycle(uint256 cycleNumber)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| cycleNumber | uint256 | the cycle number |

### FeeRefunded

An event indicating that the fee for a proposal was refunded

```solidity
event FeeRefunded(address proposal, address proposer, uint256 refund)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | The address of the proposal being refunded |
| proposer | address | The address that registered the proposal |
| refund | uint256 | The amount of tokens refunded to proposer |

### Sweep

An event indicating that the leftover funds from fees were swept to a recipient address

```solidity
event Sweep(address recipient)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | the recipient address |

### onlyPauser

```solidity
modifier onlyPauser()
```

### constructor

contract constructor

```solidity
constructor(contract Policy policy, contract ECO _eco, contract ECOxStaking _ecoXStaking, uint256 _cycleStart, address _pauser) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| policy | contract Policy | the root policy address |
| _eco | contract ECO | the ECO contract address |
| _ecoXStaking | contract ECOxStaking | the ECOxStaking contract address |
| _cycleStart | uint256 | the time that the first cycle should begin |
| _pauser | address | the new pauser |

### setPauser

sets the pauser of community governance

```solidity
function setPauser(address _pauser) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pauser | address | the new pauser |

### pause

Pauses community governance

```solidity
function pause() external
```

### updateStage

updates the current stage
called by methods propose, vote, and execute.

```solidity
function updateStage() public
```

### nextCycle

moves community governance to the next cycle

```solidity
function nextCycle() internal
```

### propose

allows a user to submit a community governance proposal

Register a new proposal for community review. Registration is necessary but does not guarantee a vote for its implementation. The proposal is stored in proposals which is an array of all submissions as well as allProposals which stores the proposal addresses. A Register event is emitted.

Registering a proposal requires a deposit of 1000 ECO (COST_REGISTER), which is transferred from the caller's balance to this contract. An allowance for this transfer must be made before calling. If the proposal does not get voted on then the caller will be entitled to claim a refund of 800 ECO (REFUND_IF_LOST). If the Circuit Breaker is enacted, this registration fee is waived as transfers cannot be made. This will confuse the refund function, but that is deprioritized in the case of a circuit breaker emergency.

**Security Notes**

- Can only be called during the proposing period.
- Requires creating an allowance for payment to call to prevent abuse.
- You cannot propose the 0 address.
- A proposal can only be registered once, regardless of proposer.

```solidity
function propose(contract Proposal _proposal) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposal | contract Proposal | the address of the deployed proposal fee is only levied if community governance is paused - we want to still be usable in the event that ECO transfers are paused. |

### support

allows an address to register its full voting power in support of a proposal

```solidity
function support(address _proposal) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposal | address | the address of proposal to be supported |

### supportPartial

allows an address to register partial support for a set of proposals

```solidity
function supportPartial(address[] _proposals, uint256[] _allocations) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposals | address[] | the array of proposals to be supported |
| _allocations | uint256[] | the respective voting power to put behind those proposals _changeSupport overwrites the previous supporting voting power, so having the same proposal multiple times in the _proposals array will not result in double counting of support |

### unsupport

allows an address to revoke support for a proposal

```solidity
function unsupport(address _proposal) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposal | address | the address of proposal to be supported |

### _changeSupport

```solidity
function _changeSupport(address supporter, address proposal, uint256 amount) internal
```

### getSupport

fetches the voting power with which a given address supports a given proposal

```solidity
function getSupport(address supporter, address proposal) public view returns (uint256 theSupport)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporter | address | the supporting address |
| proposal | address | the proposal      8 @return theSupport voting power with which a given address supports a given proposal |

### vote

allows an address to vote to enact, reject or abstain on a proposal with their full voting power

```solidity
function vote(enum CommunityGovernance.Vote choice) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| choice | enum CommunityGovernance.Vote | the address' vote |

### votePartial

allows an address to split their voting power allocation between enact, reject and abstain

```solidity
function votePartial(uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes) public
```
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

fetches the votes an address has pledged toward enacting, rejecting, and abstaining on a given proposal

```solidity
function getVotes(address voter) public view returns (uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| voter | address | the supporting address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| enactVotes | uint256 | Votes for enacting the policy |
| rejectVotes | uint256 | Votes for rejecting the policy |
| abstainVotes | uint256 | Votes for abstaining on the policy |

### execute

allows an address to enact a selected proposal that has passed the vote
it is important to do this in a timely manner, once the cycle passes it will no longer be possible to execute the proposal.
the community will have a minimum of 3 days 8 hours to enact the proposal.

```solidity
function execute() public
```

### refund

allows redemption of proposal registration fees

```solidity
function refund(address proposal) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal whose fee is being redeemed the fee will be refunded to the proposer of the proposal, regardless of who calls refund |

### sweep

allows the leftover registration fees to be drained from the contract

```solidity
function sweep(address recipient) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | the address receiving the tokens only the policy contract can call this |

