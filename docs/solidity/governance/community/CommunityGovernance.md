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

_the duration of the community governance cycle_

  ```solidity
  uint256 CYCLE_LENGTH
  ```

### PROPOSAL_LENGTH

_the duration of the proposal stage_

  ```solidity
  uint256 PROPOSAL_LENGTH
  ```

### VOTING_LENGTH

_the duration of the voting stage_

  ```solidity
  uint256 VOTING_LENGTH
  ```

### DELAY_LENGTH

_the duration of the execution delay_

  ```solidity
  uint256 DELAY_LENGTH
  ```

### pauser

_address allowed to pause community governance_

  ```solidity
  address pauser
  ```

### proposals

_reference any proposal by its address_

  ```solidity
  mapping(address => struct CommunityGovernance.PropData) proposals
  ```

### cycleCount

_number of voting cycles since launch_

  ```solidity
  uint256 cycleCount
  ```

### cycleStart

_start of the current cycle_

  ```solidity
  uint256 cycleStart
  ```

### stage

_current stage in the cycle_

  ```solidity
  enum CommunityGovernance.Stage stage
  ```

### currentStageEnd

_end time of current_

  ```solidity
  uint256 currentStageEnd
  ```

### snapshotBlock

_snapshot block for calculating voting power_

  ```solidity
  uint256 snapshotBlock
  ```

### proposalFee

_cost in ECO to submit a proposal_

  ```solidity
  uint256 proposalFee
  ```

### feeRefund

_proposal fee to be refunded if proposal is not enacted_

  ```solidity
  uint256 feeRefund
  ```

### supportThresholdPercent

_the percent of total VP that must be supporting a proposal in order to advance it to the voting stage_

  ```solidity
  uint256 supportThresholdPercent
  ```

### voteThresholdPercent

_the percent of total VP that must have voted to enact a proposal in order to bypass the delay period_

  ```solidity
  uint256 voteThresholdPercent
  ```

### cycleTotalVotingPower

_total voting power for the cycle_

  ```solidity
  uint256 cycleTotalVotingPower
  ```

### selectedProposal

_the proposal being voted on this cycle_

  ```solidity
  address selectedProposal
  ```

### totalEnactVotes

_total votes to enact the selected proposal_

  ```solidity
  uint256 totalEnactVotes
  ```

### totalRejectVotes

_total votes to reject the selected proposal_

  ```solidity
  uint256 totalRejectVotes
  ```

### totalAbstainVotes

_total votes to abstain from voting on the selected proposal_

  ```solidity
  uint256 totalAbstainVotes
  ```

### pot

_redeemable tokens from fees_

  ```solidity
  uint256 pot
  ```

### OnlyPauser

_thrown when non-pauser tries to call pause without permission_

  ```solidity
  error OnlyPauser()
  ```

### WrongStage

_thrown when a call is made during the wrong stage of Community Governance_

  ```solidity
  error WrongStage()
  ```

### DuplicateProposal

_thrown when a proposal that already exists is proposed again_

  ```solidity
  error DuplicateProposal()
  ```

### ArrayLengthMismatch

_thrown when related argument arrays have differing lengths_

  ```solidity
  error ArrayLengthMismatch()
  ```

### BadVotingPower

_thrown when the voting power of a support or vote action is invalid_

  ```solidity
  error BadVotingPower()
  ```

### NoSupportToRevoke

_thrown when unsupport is called without the caller having supported the proposal_

  ```solidity
  error NoSupportToRevoke()
  ```

### BadVoteType

_thrown when vote is called with a vote type other than enact, reject, abstain_

  ```solidity
  error BadVoteType()
  ```

### NoRefundAvailable

_thrown when refund is called on a proposal for which no refund is available_

  ```solidity
  error NoRefundAvailable(address proposal)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal whose refund was attempted |

### NoRefundDuringCycle

_thrown when refund is called on a proposal that was submitted in the current cycle_

  ```solidity
  error NoRefundDuringCycle(address proposal)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal whose refund was attempted |

### PauserAssignment

_event indicating the pauser was updated_

  ```solidity
  event PauserAssignment(address pauser)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pauser | address | The new pauser |

### StageUpdated

_event indicating a change in the community governance stage_

  ```solidity
  event StageUpdated(enum CommunityGovernance.Stage stage)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stage | enum CommunityGovernance.Stage | the new stage |

### ProposalRegistration

_An event indicating a proposal has been registered_

  ```solidity
  event ProposalRegistration(address proposer, contract Proposal proposal)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposer | address | The address that submitted the proposal |
| proposal | contract Proposal | The address of the proposal contract instance that was added |

### SupportChanged

_An event indicating a change in support for a proposal_

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

_An event indicating a vote cast on a proposal_

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

_An event indicating that the proposal selected for this governance cycle was successfully executed_

  ```solidity
  event ExecutionComplete(address proposal)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | The proposal that was executed |

### NewCycle

_An event indicating that a new cycle has begun_

  ```solidity
  event NewCycle(uint256 cycleNumber)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| cycleNumber | uint256 | the cycle number |

### FeeRefunded

_An event indicating that the fee for a proposal was refunded
     @param proposal The address of the proposal being refunded
     @param proposer The address that registered the proposal
     @param refund The amount of tokens refunded to proposer_

  ```solidity
  event FeeRefunded(address proposal, address proposer, uint256 refund)
  ```

### Sweep

_An event indicating that the leftover funds from fees were swept to a recipient address_

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

_contract constructor_

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

_sets the pauser of community governance_

  ```solidity
  function setPauser(address _pauser) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pauser | address | the new pauser |

### pause

_Pauses community governance_

  ```solidity
  function pause() external
  ```

### updateStage

_updates the current stage
called by methods propose, vote, and execute._

  ```solidity
  function updateStage() public
  ```

### nextCycle

_moves community governance to the next cycle_

  ```solidity
  function nextCycle() internal
  ```

### propose

_allows a user to submit a community governance proposal
fee is only levied if community governance is paused - we want to still be usable
in the event that ECO transfers are paused._

  ```solidity
  function propose(contract Proposal _proposal) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposal | contract Proposal | the address of the deployed proposal |

### support

_allows an address to register its full voting power in support of a proposal_

  ```solidity
  function support(address _proposal) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposal | address | the address of proposal to be supported |

### supportPartial

_allows an address to register partial support for a set of proposals
_changeSupport overwrites the previous supporting voting power, so having the same proposal multiple times in the _proposals array will not result in double counting of support_

  ```solidity
  function supportPartial(address[] _proposals, uint256[] _allocations) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposals | address[] | the array of proposals to be supported |
| _allocations | uint256[] | the respective voting power to put behind those proposals |

### unsupport

_allows an address to revoke support for a proposal_

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

_fetches the voting power with which a given address supports a given proposal_

  ```solidity
  function getSupport(address supporter, address proposal) public view returns (uint256 support)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supporter | address | the supporting address |
| proposal | address | the proposal |

### vote

_allows an address to vote to enact, reject or abstain on a proposal with their full voting power_

  ```solidity
  function vote(enum CommunityGovernance.Vote choice) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| choice | enum CommunityGovernance.Vote | the address' vote |

### votePartial

_allows an address to split their voting power allocation between enact, reject and abstain_

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

_fetches the votes an address has pledged toward enacting, rejecting, and abstaining on a given proposal_

  ```solidity
  function getVotes(address voter) public view returns (uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| voter | address | the supporting address |

### execute

_allows an address to enact a selected proposal that has passed the vote
it is important to do this in a timely manner, once the cycle passes it will no longer be possible to execute the proposal.
the community will have a minimum of 3 days 8 hours to enact the proposal._

  ```solidity
  function execute() public
  ```

### refund

_allows redemption of proposal registration fees
the fee will be refunded to the proposer of the proposal, regardless of who calls refund_

  ```solidity
  function refund(address proposal) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposal | address | the proposal whose fee is being redeemed |

### sweep

_allows the leftover registration fees to be drained from the contract
only the policy contract can call this_

  ```solidity
  function sweep(address recipient) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | the address receiving the tokens |

