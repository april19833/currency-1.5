# Eco Association
Copyright (c) 2023 Eco Association

## CurrencyGovernance

### MonetaryPolicy

```solidity
struct MonetaryPolicy {
  uint256 cycle;
  address[] targets;
  bytes4[] signatures;
  bytes[] calldatas;
  uint256 support;
  mapping(address => bool) supporters;
  string description;
}
```

### Vote

```solidity
struct Vote {
  bytes32 proposalId;
  uint256 score;
}
```

### TimingData

```solidity
struct TimingData {
  uint256 currentCycle;
  enum CurrencyGovernance.Stage currentStage;
}
```

### Stage

```solidity
enum Stage {
  Propose,
  Commit,
  Reveal
}
```

### trustedNodes

```solidity
contract TrustedNodes trustedNodes
```

### enacter

```solidity
contract MonetaryPolicyAdapter enacter
```

### governanceStartTime

```solidity
uint256 governanceStartTime
```

### PROPOSAL_TIME

```solidity
uint256 PROPOSAL_TIME
```

### VOTING_TIME

```solidity
uint256 VOTING_TIME
```

### REVEAL_TIME

```solidity
uint256 REVEAL_TIME
```

### CYCLE_LENGTH

```solidity
uint256 CYCLE_LENGTH
```

### START_CYCLE

```solidity
uint256 START_CYCLE
```

### IDEMPOTENT_INFLATION_MULTIPLIER

```solidity
uint256 IDEMPOTENT_INFLATION_MULTIPLIER
```

### MAX_DESCRIPTION_DATA

```solidity
uint256 MAX_DESCRIPTION_DATA
```

### MAX_TARGETS

```solidity
uint256 MAX_TARGETS
```

### proposals

```solidity
mapping(bytes32 => struct CurrencyGovernance.MonetaryPolicy) proposals
```

### trusteeSupports

```solidity
mapping(address => uint256) trusteeSupports
```

### commitments

```solidity
mapping(address => bytes32) commitments
```

### scores

```solidity
mapping(bytes32 => uint256) scores
```

### leader

```solidity
bytes32 leader
```

used to track the leading proposalId during the vote totalling
tracks the winner between reveal phases
is deleted on enact to ensure it can only be enacted once

### NonZeroTrustedNodesAddr

```solidity
error NonZeroTrustedNodesAddr()
```

### NonZeroEnacterAddr

```solidity
error NonZeroEnacterAddr()
```

### TrusteeOnlyFunction

```solidity
error TrusteeOnlyFunction()
```

### WrongStage

```solidity
error WrongStage()
```

### CycleIncomplete

```solidity
error CycleIncomplete(uint256 requestedCycle, uint256 currentCycle)
```

Early finazilation error
for when a cycle is attempted to be finalized before it finishes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| requestedCycle | uint256 | the cycle submitted by the end user to access |
| currentCycle | uint256 | the current cycle as calculated by the contract |

### ExceedsMaxDescriptionSize

```solidity
error ExceedsMaxDescriptionSize(uint256 submittedLength)
```

Description length error
for when a proposal is submitted with too long of a description

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| submittedLength | uint256 | the length of the submitted description, to be compared against MAX_DESCRIPTION_DATA |

### BadNumTargets

```solidity
error BadNumTargets(uint256 submittedLength)
```

Targets length error
for when a proposal is submitted with too many actions or zero actions

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| submittedLength | uint256 | the length of the submitted targets array, to be compared against MAX_TARGETS and 0 |

### ProposalActionsArrayMismatch

```solidity
error ProposalActionsArrayMismatch()
```

### SupportAlreadyGiven

```solidity
error SupportAlreadyGiven()
```

### SupportNotGiven

```solidity
error SupportNotGiven()
```

### DuplicateProposal

```solidity
error DuplicateProposal()
```

### NoSuchProposal

```solidity
error NoSuchProposal()
```

### DuplicateSupport

```solidity
error DuplicateSupport()
```

### CannotVoteEmpty

```solidity
error CannotVoteEmpty()
```

### NoCommitFound

```solidity
error NoCommitFound()
```

### CommitMismatch

```solidity
error CommitMismatch()
```

### InvalidVoteBadProposalId

```solidity
error InvalidVoteBadProposalId(struct CurrencyGovernance.Vote vote)
```

error for when a proposalId in a trustee's vote is not one from the current cycle or is completely invalid

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| vote | struct CurrencyGovernance.Vote | the vote containing the invalid proposalId |

### InvalidVoteBadProposalOrder

```solidity
error InvalidVoteBadProposalOrder(struct CurrencyGovernance.Vote prevVote, struct CurrencyGovernance.Vote vote)
```

error for when the proposalIds in a trustee's vote are not strictly increasing

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| prevVote | struct CurrencyGovernance.Vote | the vote before the invalid vote |
| vote | struct CurrencyGovernance.Vote | the vote with the non-increasing proposalId |

### InvalidVoteBadScore

```solidity
error InvalidVoteBadScore(struct CurrencyGovernance.Vote vote)
```

error for when a score in a trustee's vote is either duplicate or doesn't respect support weightings

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| vote | struct CurrencyGovernance.Vote | the vote containing the invalid score |

### InvalidVotesOutOfBounds

```solidity
error InvalidVotesOutOfBounds()
```

### EnactCycleNotCurrent

```solidity
error EnactCycleNotCurrent()
```

### NewTrustedNodes

```solidity
event NewTrustedNodes(contract TrustedNodes newTrustedNodes, contract TrustedNodes oldTrustedNodes)
```

emits when the trustedNodes contract is changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newTrustedNodes | contract TrustedNodes | denotes the new trustedNodes contract address |
| oldTrustedNodes | contract TrustedNodes | denotes the old trustedNodes contract address |

### NewEnacter

```solidity
event NewEnacter(contract MonetaryPolicyAdapter newEnacter, contract MonetaryPolicyAdapter oldEnacter)
```

emits when the enacter contract is changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newEnacter | contract MonetaryPolicyAdapter | denotes the new enacter contract address |
| oldEnacter | contract MonetaryPolicyAdapter | denotes the old enacter contract address |

### ProposalCreation

```solidity
event ProposalCreation(address _trusteeAddress, uint256 _cycle, bytes32 id, string _description)
```

Tracking for proposal creation
emitted when a proposal is submitted to track the values

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _trusteeAddress | address | the address of the trustee that submitted the proposal |
| _cycle | uint256 | the cycle during which the proposal was submitted |
| id | bytes32 | the lookup id for the proposal in the proposals mapping is created via a hash of _cycle, _targets, _signatures, and _calldatas; see getProposalHash for more details |
| _description | string | a string allowing the trustee to describe the proposal or link to discussions on the proposal |

### Support

```solidity
event Support(address trustee, bytes32 proposalId, uint256 cycle)
```

Tracking for support actions
emitted when a trustee adds their support for a proposal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the address of the trustee supporting |
| proposalId | bytes32 | the lookup for the proposal being supported |
| cycle | uint256 | the cycle during which the support action happened |

### Unsupport

```solidity
event Unsupport(address trustee, bytes32 proposalId, uint256 cycle)
```

Tracking for unsupport actions
emitted when a trustee retracts their support for a proposal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the address of the trustee unsupporting |
| proposalId | bytes32 | the lookup for the proposal being unsupported |
| cycle | uint256 | the cycle during which the support action happened |

### ProposalDeleted

```solidity
event ProposalDeleted(bytes32 proposalId, uint256 cycle)
```

Tracking for removed proposals
emitted when the last trustee retracts their support for a proposal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposalId | bytes32 | the lookup for the proposal being deleted |
| cycle | uint256 | the cycle during which the unsupport deletion action happened |

### VoteCommit

```solidity
event VoteCommit(address trustee, uint256 cycle)
```

Fired when a trustee commits their vote.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustee | address | the trustee that committed the vote |
| cycle | uint256 | the cycle for the commitment |

### VoteReveal

```solidity
event VoteReveal(address voter, uint256 cycle, struct CurrencyGovernance.Vote[] votes)
```

Fired when a vote is revealed, to create a voting history for all participants.
Records the voter, as well as all of the parameters of the vote cast.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| voter | address | the trustee who revealed their vote |
| cycle | uint256 | the cycle when the vote was cast and counted |
| votes | struct CurrencyGovernance.Vote[] | the array of Vote structs that composed the trustee's ballot |

### VoteResult

```solidity
event VoteResult(uint256 cycle, bytes32 winner)
```

Fired when vote results are computed, creating a permanent record of vote outcomes.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| cycle | uint256 | the cycle for which this is the vote result |
| winner | bytes32 | the proposalId for the proposal that won |

### onlyTrusted

```solidity
modifier onlyTrusted()
```

Restrict access to trusted nodes only.

### duringProposePhase

```solidity
modifier duringProposePhase()
```

### duringVotePhase

```solidity
modifier duringVotePhase()
```

### duringRevealPhase

```solidity
modifier duringRevealPhase()
```

### cycleComplete

```solidity
modifier cycleComplete(uint256 cycle)
```

### constructor

```solidity
constructor(contract Policy _policy, contract TrustedNodes _trustedNodes, contract MonetaryPolicyAdapter _enacter) public
```

constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | the owning policy address for the contract |
| _trustedNodes | contract TrustedNodes | the contract to manage what addresses are trustees |
| _enacter | contract MonetaryPolicyAdapter |  |

### setTrustedNodes

```solidity
function setTrustedNodes(contract TrustedNodes _trustedNodes) external
```

setter function for trustedNodes var
only available to the owning policy contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _trustedNodes | contract TrustedNodes | the value to set the new trustedNodes address to, cannot be zero |

### _setTrustedNodes

```solidity
function _setTrustedNodes(contract TrustedNodes _trustedNodes) internal
```

### setEnacter

```solidity
function setEnacter(contract MonetaryPolicyAdapter _enacter) external
```

setter function for enacter var
only available to the owning policy contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _enacter | contract MonetaryPolicyAdapter | the value to set the new enacter address to, cannot be zero |

### _setEnacter

```solidity
function _setEnacter(contract MonetaryPolicyAdapter _enacter) internal
```

### getCurrentStage

```solidity
function getCurrentStage() public view returns (struct CurrencyGovernance.TimingData)
```

getter for timing data
calculates and returns the current cycle and the current stage

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct CurrencyGovernance.TimingData | TimingData type of { uint256 cycle, Stage stage } |

### getCurrentCycle

```solidity
function getCurrentCycle() public view returns (uint256)
```

getter for just the current cycle
calculates and returns, used internally

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | cycle the index for the currently used governance recording mappings |

### propose

```solidity
function propose(address[] targets, bytes4[] signatures, bytes[] calldatas, string description) external
```

propose a monetary policy
this function allows trustees to submit a potential monetary policy
if there is already a proposed monetary policy by the trustee, this overwrites it
\\param these will be done later when I change this whole function

### canSupport

```solidity
function canSupport(address _address) public view returns (bool)
```

getter for duplicate support checks
the function just pulls to see if the address has supported this generation
doesn't check to see if the address is a trustee

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | the address to check. not msg.sender for dapp related purposes |

### getProposalId

```solidity
function getProposalId(uint256 _cycle, address[] _targets, bytes4[] _signatures, bytes[] _calldatas) public pure returns (bytes32)
```

### getProposalTargets

```solidity
function getProposalTargets(bytes32 proposalId) external view returns (address[])
```

### getProposalSignatures

```solidity
function getProposalSignatures(bytes32 proposalId) external view returns (bytes4[])
```

### getProposalCalldatas

```solidity
function getProposalCalldatas(bytes32 proposalId) external view returns (bytes[])
```

### getProposalSupporter

```solidity
function getProposalSupporter(bytes32 proposalId, address supporter) external view returns (bool)
```

### supportProposal

```solidity
function supportProposal(bytes32 proposalId) external
```

add your support to a monetary policy
this function allows you to increase the support weight to an already submitted proposal
the submitter of a proposal default supports it
support for a proposal is close to equivalent of submitting a duplicate proposal to pad the ranking
need to link to borda count analysis by christian here

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposalId | bytes32 | the lookup ID for the proposal that's being supported |

### unsupportProposal

```solidity
function unsupportProposal(bytes32 proposalId) external
```

removes your support to a monetary policy
this function allows you to reduce the support weight to an already submitted proposal
you must unsupport first if you currently have supported if you want to support or propose another proposal
the last person who unsupports the proposal deletes the proposal

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| proposalId | bytes32 | the lookup ID for the proposal that's being unsupported |

### commit

```solidity
function commit(bytes32 _commitment) external
```

submit a vote commitment
this function allows trustees to submit a commit hash of their vote
commitment is salted so that it is a blind vote process
calling additional times overwrites previous commitments

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _commitment | bytes32 | the hash commit to check against when revealing the structure of the commit is keccak256(abi.encode(salt, cycleIndex, msg.sender, votes)) where votes is an array of Vote structs |

### reveal

```solidity
function reveal(address _trustee, bytes32 _salt, struct CurrencyGovernance.Vote[] _votes) external
```

reveal a committed vote
this function allows trustees to reveal their previously committed votes once the reveal phase is entered
in revealing the vote, votes are tallied, a running tally of each proposal's votes is kept in storage during this phase

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _trustee | address | the trustee's commit to try and reveal trustees can obviously reveal their own commits, but this allows for a delegated reveal the commit structure means that only the correct committed vote can ever be revealed, no matter who reveals it reveals are attributed to this trustee |
| _salt | bytes32 | the salt for the commit hash to make the vote secret |
| _votes | struct CurrencyGovernance.Vote[] | the array of Vote objects { bytes32 proposal, uint256 ranking } that follows our modified Borda scheme. The votes need to be arranged in ascending order of address and ranked via the integers 1 to the number of proposals ranked. |

### enact

```solidity
function enact(uint256 _cycle) external
```

send the results to the adapter for enaction

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _cycle | uint256 | cycle index must match the cycle just completed as denoted on the proposal marked by the leader variable |

