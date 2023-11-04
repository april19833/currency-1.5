# Eco Association

Copyright (c) 2023 Eco Association

## PolicyVotes

### proposal

```solidity
contract Proposal proposal
```

The proposal being voted on

### proposer

```solidity
address proposer
```

### VotePartial

```solidity
struct VotePartial {
  uint256 stake;
  uint256 yesVotes;
}
```

### votePartials

```solidity
mapping(address => struct PolicyVotes.VotePartial) votePartials
```

The voting power that a user has based on their stake and
 the portion that they have voted yes with

### totalStake

```solidity
uint256 totalStake
```

Total currency staked in all ongoing votes in basic unit of 10^{-18} ECO (weico).

### yesStake

```solidity
uint256 yesStake
```

Total revealed positive stake in basic unit of 10^{-18} ECO (weico).

### VOTE_TIME

```solidity
uint256 VOTE_TIME
```

The length of the commit portion of the voting phase.

### ENACTION_DELAY

```solidity
uint256 ENACTION_DELAY
```

The delay on a plurality win

### voteEnds

```solidity
uint256 voteEnds
```

The timestamp at which the commit portion of the voting phase ends.

### Result

```solidity
enum Result {
  Accepted,
  Rejected,
  Failed
}
```

### VoteCompletion

```solidity
event VoteCompletion(enum PolicyVotes.Result result)
```

Event emitted when the vote outcome is known.

### PolicyVote

```solidity
event PolicyVote(address voter, uint256 votesYes, uint256 votesNo)
```

Event emitted when a vote is submitted.
simple votes have the address's voting power as votesYes or votesNo, depending on the vote
split votes show the split and votesYes + votesNo might be less than the address's voting power

### blockNumber

```solidity
uint256 blockNumber
```

The store block number to use when checking account balances for staking.

### constructor

```solidity
constructor(contract Policy _policy, contract ECO _ecoAddr) public
```

This constructor just passes the call to the super constructor

### vote

```solidity
function vote(bool _vote) external
```

Submit your yes/no support

Shows whether or not your voting power supports or does not support the vote

Note Not voting is not equivalent to voting no. Percentage of voted support,
not percentage of total voting power is used to determine the win.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _vote | bool | The vote for the proposal |

### voteSplit

```solidity
function voteSplit(uint256 _votesYes, uint256 _votesNo) external
```

Submit a mixed vote of yes/no support

Useful for contracts that wish to vote for an agregate of users

Note As not voting is not equivalent to voting no it matters recording the no votes
The total amount of votes in favor is relevant for early enaction and the total percentage
of voting power that voted is necessary for determining a winner.

Note As this is designed for contracts, the onus is on the contract designer to correctly
understand and take responsibility for its input parameters. The only check is to stop
someone from voting with more power than they have.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _votesYes | uint256 | The amount of votes in favor of the proposal |
| _votesNo | uint256 | The amount of votes against the proposal |

### initialize

```solidity
function initialize(address _self) public
```

Initialize a cloned/proxied copy of this contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | The original contract, to provide access to storage data. |

### configure

```solidity
function configure(contract Proposal _proposal, address _proposer, uint256 _cutoffBlockNumber, uint256 _totalECOxSnapshot, uint256 _excludedVotingPower) external
```

Configure the proposals that are part of this voting cycle and start
the lockup period.

This also fixes the end times of each subsequent phase.

This can only be called once, and should be called atomically with
instantiation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _proposal | contract Proposal | The proposal to vote on. |
| _proposer | address |  |
| _cutoffBlockNumber | uint256 |  |
| _totalECOxSnapshot | uint256 |  |
| _excludedVotingPower | uint256 |  |

### execute

```solidity
function execute() external
```

Execute the proposal if it has enough support.

Can only be called after the voting and the delay phase,
or after the point that at least 50% of the total voting power
has voted in favor of the proposal.

If the proposal has been accepted, it will be enacted by
calling the `enacted` functions using `delegatecall`
from the root policy.

