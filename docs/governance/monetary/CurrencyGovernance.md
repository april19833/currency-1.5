# CurrencyGovernance



> Trustee monetary policy decision process This contract oversees the voting on the currency monetary levers. Trustees vote on a policy that is implemented at the conclusion of the cycle





## Methods

### CYCLE_LENGTH

```solidity
function CYCLE_LENGTH() external view returns (uint256)
```



*CYCLE_LENGTH equals the proposal time + voting time + reveal time*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | CYCLE_LENGTH proposal time + voting time + reveal time |

### IDEMPOTENT_INFLATION_MULTIPLIER

```solidity
function IDEMPOTENT_INFLATION_MULTIPLIER() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### MAX_DESCRIPTION_DATA

```solidity
function MAX_DESCRIPTION_DATA() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### MAX_TARGETS

```solidity
function MAX_TARGETS() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### PROPOSAL_TIME

```solidity
function PROPOSAL_TIME() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### REVEAL_TIME

```solidity
function REVEAL_TIME() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### START_CYCLE

```solidity
function START_CYCLE() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### VOTING_TIME

```solidity
function VOTING_TIME() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### canSupport

```solidity
function canSupport(address _address) external view returns (bool)
```

getter for duplicate support checks the function just pulls to see if the address has supported this generation doesn&#39;t check to see if the address is a trustee



#### Parameters

| Name | Type | Description |
|---|---|---|
| _address | address | the address to check. not msg.sender for dapp related purposes |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### commit

```solidity
function commit(bytes32 _commitment) external nonpayable
```

submit a vote commitment this function allows trustees to submit a commit hash of their vote commitment is salted so that it is a blind vote process calling additional times overwrites previous commitments



#### Parameters

| Name | Type | Description |
|---|---|---|
| _commitment | bytes32 | the hash commit to check against when revealing the structure of the commit is keccak256(abi.encode(salt, cycleIndex, msg.sender, votes)) where votes is an array of Vote structs |

### commitments

```solidity
function commitments(address) external view returns (bytes32)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### enact

```solidity
function enact(uint256 _cycle) external nonpayable
```

send the results to the adapter for enaction



#### Parameters

| Name | Type | Description |
|---|---|---|
| _cycle | uint256 | cycle index must match the cycle just completed as denoted on the proposal marked by the leader variable |

### enacter

```solidity
function enacter() external view returns (contract MonetaryPolicyAdapter)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract MonetaryPolicyAdapter | undefined |

### getCurrentCycle

```solidity
function getCurrentCycle() external view returns (uint256)
```

getter for just the current cycle calculates and returns, used internally




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | cycle the index for the currently used governance recording mappings |

### getCurrentStage

```solidity
function getCurrentStage() external view returns (struct CurrencyGovernance.TimingData)
```

getter for timing data calculates and returns the current cycle and the current stage




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | CurrencyGovernance.TimingData | TimingData type of { uint256 cycle, Stage stage } |

### getProposalCalldatas

```solidity
function getProposalCalldatas(bytes32 proposalId) external view returns (bytes[])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes[] | undefined |

### getProposalId

```solidity
function getProposalId(uint256 _cycle, address[] _targets, bytes4[] _signatures, bytes[] _calldatas) external pure returns (bytes32)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _cycle | uint256 | undefined |
| _targets | address[] | undefined |
| _signatures | bytes4[] | undefined |
| _calldatas | bytes[] | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### getProposalSignatures

```solidity
function getProposalSignatures(bytes32 proposalId) external view returns (bytes4[])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes4[] | undefined |

### getProposalSupporter

```solidity
function getProposalSupporter(bytes32 proposalId, address supporter) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | bytes32 | undefined |
| supporter | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### getProposalTargets

```solidity
function getProposalTargets(bytes32 proposalId) external view returns (address[])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined |

### governanceStartTime

```solidity
function governanceStartTime() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### leader

```solidity
function leader() external view returns (bytes32)
```

used to track the leading proposalId during the vote totalling tracks the winner between reveal phases is deleted on enact to ensure it can only be enacted once




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### policy

```solidity
function policy() external view returns (contract Policy)
```

The address of the root policy instance overseeing this instance. This address can be used for ERC1820 lookup of other components, ERC1820 lookup of role policies, and interaction with the policy hierarchy.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Policy | undefined |

### proposals

```solidity
function proposals(bytes32) external view returns (uint256 cycle, uint256 support, string description)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| cycle | uint256 | undefined |
| support | uint256 | undefined |
| description | string | undefined |

### propose

```solidity
function propose(address[] targets, bytes4[] signatures, bytes[] calldatas, string description) external nonpayable
```

propose a monetary policy this function allows trustees to submit a potential monetary policy if there is already a proposed monetary policy by the trustee, this overwrites it \\param these will be done later when I change this whole function



#### Parameters

| Name | Type | Description |
|---|---|---|
| targets | address[] | undefined |
| signatures | bytes4[] | undefined |
| calldatas | bytes[] | undefined |
| description | string | undefined |

### reveal

```solidity
function reveal(address _trustee, bytes32 _salt, CurrencyGovernance.Vote[] _votes) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _trustee | address | undefined |
| _salt | bytes32 | undefined |
| _votes | CurrencyGovernance.Vote[] | undefined |

### scores

```solidity
function scores(bytes32) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### setEnacter

```solidity
function setEnacter(contract MonetaryPolicyAdapter _enacter) external nonpayable
```

setter function for enacter var only available to the owning policy contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| _enacter | contract MonetaryPolicyAdapter | the value to set the new enacter address to, cannot be zero |

### setTrustedNodes

```solidity
function setTrustedNodes(contract TrustedNodes _trustedNodes) external nonpayable
```

setter function for trustedNodes var only available to the owning policy contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| _trustedNodes | contract TrustedNodes | the value to set the new trustedNodes address to, cannot be zero |

### supportProposal

```solidity
function supportProposal(bytes32 proposalId) external nonpayable
```

add your support to a monetary policy this function allows you to increase the support weight to an already submitted proposal the submitter of a proposal default supports it support for a proposal is close to equivalent of submitting a duplicate proposal to pad the ranking need to link to borda count analysis by christian here



#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | bytes32 | the lookup ID for the proposal that&#39;s being supported |

### trustedNodes

```solidity
function trustedNodes() external view returns (contract TrustedNodes)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract TrustedNodes | undefined |

### trusteeSupports

```solidity
function trusteeSupports(address) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### unsupportProposal

```solidity
function unsupportProposal(bytes32 proposalId) external nonpayable
```

removes your support to a monetary policy this function allows you to reduce the support weight to an already submitted proposal you must unsupport first if you currently have supported if you want to support or propose another proposal the last person who unsupports the proposal deletes the proposal



#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId | bytes32 | the lookup ID for the proposal that&#39;s being unsupported |



## Events

### NewEnacter

```solidity
event NewEnacter(contract MonetaryPolicyAdapter newEnacter, contract MonetaryPolicyAdapter oldEnacter)
```

emits when the enacter contract is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| newEnacter  | contract MonetaryPolicyAdapter | denotes the new enacter contract address |
| oldEnacter  | contract MonetaryPolicyAdapter | denotes the old enacter contract address |

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

### NewTrustedNodes

```solidity
event NewTrustedNodes(contract TrustedNodes newTrustedNodes, contract TrustedNodes oldTrustedNodes)
```

emits when the trustedNodes contract is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| newTrustedNodes  | contract TrustedNodes | denotes the new trustedNodes contract address |
| oldTrustedNodes  | contract TrustedNodes | denotes the old trustedNodes contract address |

### ProposalCreation

```solidity
event ProposalCreation(address indexed _trusteeAddress, uint256 indexed _cycle, bytes32 id, string _description)
```

Tracking for proposal creation emitted when a proposal is submitted to track the values



#### Parameters

| Name | Type | Description |
|---|---|---|
| _trusteeAddress `indexed` | address | the address of the trustee that submitted the proposal |
| _cycle `indexed` | uint256 | the cycle during which the proposal was submitted |
| id  | bytes32 | the lookup id for the proposal in the proposals mapping is created via a hash of _cycle, _targets, _signatures, and _calldatas; see getProposalHash for more details |
| _description  | string | a string allowing the trustee to describe the proposal or link to discussions on the proposal |

### ProposalDeleted

```solidity
event ProposalDeleted(bytes32 indexed proposalId, uint256 indexed cycle)
```

Tracking for removed proposals emitted when the last trustee retracts their support for a proposal



#### Parameters

| Name | Type | Description |
|---|---|---|
| proposalId `indexed` | bytes32 | the lookup for the proposal being deleted |
| cycle `indexed` | uint256 | the cycle during which the unsupport deletion action happened |

### Support

```solidity
event Support(address indexed trustee, bytes32 indexed proposalId, uint256 indexed cycle)
```

Tracking for support actions emitted when a trustee adds their support for a proposal



#### Parameters

| Name | Type | Description |
|---|---|---|
| trustee `indexed` | address | the address of the trustee supporting |
| proposalId `indexed` | bytes32 | the lookup for the proposal being supported |
| cycle `indexed` | uint256 | the cycle during which the support action happened |

### Unsupport

```solidity
event Unsupport(address indexed trustee, bytes32 indexed proposalId, uint256 indexed cycle)
```

Tracking for unsupport actions emitted when a trustee retracts their support for a proposal



#### Parameters

| Name | Type | Description |
|---|---|---|
| trustee `indexed` | address | the address of the trustee unsupporting |
| proposalId `indexed` | bytes32 | the lookup for the proposal being unsupported |
| cycle `indexed` | uint256 | the cycle during which the support action happened |

### VoteCommit

```solidity
event VoteCommit(address indexed trustee, uint256 indexed cycle)
```

Fired when a trustee commits their vote.



#### Parameters

| Name | Type | Description |
|---|---|---|
| trustee `indexed` | address | the trustee that committed the vote |
| cycle `indexed` | uint256 | the cycle for the commitment |

### VoteResult

```solidity
event VoteResult(uint256 cycle, bytes32 winner)
```

Fired when vote results are computed, creating a permanent record of vote outcomes.



#### Parameters

| Name | Type | Description |
|---|---|---|
| cycle  | uint256 | the cycle for which this is the vote result |
| winner  | bytes32 | the proposalId for the proposal that won |

### VoteReveal

```solidity
event VoteReveal(address indexed voter, uint256 indexed cycle, CurrencyGovernance.Vote[] votes)
```

Fired when a vote is revealed, to create a voting history for all participants. Records the voter, as well as all of the parameters of the vote cast.



#### Parameters

| Name | Type | Description |
|---|---|---|
| voter `indexed` | address | the trustee who revealed their vote |
| cycle `indexed` | uint256 | the cycle when the vote was cast and counted |
| votes  | CurrencyGovernance.Vote[] | the array of Vote structs that composed the trustee&#39;s ballot |



## Errors

### BadNumTargets

```solidity
error BadNumTargets(uint256 submittedLength)
```

Targets length error for when a proposal is submitted with too many actions or zero actions



#### Parameters

| Name | Type | Description |
|---|---|---|
| submittedLength | uint256 | the length of the submitted targets array, to be compared against MAX_TARGETS and 0 |

### CannotVoteEmpty

```solidity
error CannotVoteEmpty()
```






### CommitMismatch

```solidity
error CommitMismatch()
```






### CycleIncomplete

```solidity
error CycleIncomplete(uint256 requestedCycle, uint256 currentCycle)
```

Early finazilation error for when a cycle is attempted to be finalized before it finishes



#### Parameters

| Name | Type | Description |
|---|---|---|
| requestedCycle | uint256 | the cycle submitted by the end user to access |
| currentCycle | uint256 | the current cycle as calculated by the contract |

### DuplicateProposal

```solidity
error DuplicateProposal()
```






### DuplicateSupport

```solidity
error DuplicateSupport()
```






### EnactCycleNotCurrent

```solidity
error EnactCycleNotCurrent()
```






### ExceedsMaxDescriptionSize

```solidity
error ExceedsMaxDescriptionSize(uint256 submittedLength)
```

Description length error for when a proposal is submitted with too long of a description



#### Parameters

| Name | Type | Description |
|---|---|---|
| submittedLength | uint256 | the length of the submitted description, to be compared against MAX_DESCRIPTION_DATA |

### InvalidVoteBadProposalId

```solidity
error InvalidVoteBadProposalId(CurrencyGovernance.Vote vote)
```

error for when a proposalId in a trustee&#39;s vote is not one from the current cycle or is completely invalid



#### Parameters

| Name | Type | Description |
|---|---|---|
| vote | CurrencyGovernance.Vote | the vote containing the invalid proposalId |

### InvalidVoteBadProposalOrder

```solidity
error InvalidVoteBadProposalOrder(CurrencyGovernance.Vote prevVote, CurrencyGovernance.Vote vote)
```

error for when the proposalIds in a trustee&#39;s vote are not strictly increasing



#### Parameters

| Name | Type | Description |
|---|---|---|
| prevVote | CurrencyGovernance.Vote | the vote before the invalid vote |
| vote | CurrencyGovernance.Vote | the vote with the non-increasing proposalId |

### InvalidVoteBadScore

```solidity
error InvalidVoteBadScore(CurrencyGovernance.Vote vote)
```

error for when a score in a trustee&#39;s vote is either duplicate or doesn&#39;t respect support weightings



#### Parameters

| Name | Type | Description |
|---|---|---|
| vote | CurrencyGovernance.Vote | the vote containing the invalid score |

### InvalidVotesOutOfBounds

```solidity
error InvalidVotesOutOfBounds()
```






### NoCommitFound

```solidity
error NoCommitFound()
```






### NoSuchProposal

```solidity
error NoSuchProposal()
```






### NonZeroEnacterAddr

```solidity
error NonZeroEnacterAddr()
```






### NonZeroPolicyAddr

```solidity
error NonZeroPolicyAddr()
```






### NonZeroTrustedNodesAddr

```solidity
error NonZeroTrustedNodesAddr()
```






### PolicyOnlyFunction

```solidity
error PolicyOnlyFunction()
```






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






### TrusteeOnlyFunction

```solidity
error TrusteeOnlyFunction()
```






### WrongStage

```solidity
error WrongStage()
```







