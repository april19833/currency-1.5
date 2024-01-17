# Community Governance System

> Community governance policies for the Eco currency.

These contracts provide the community governance system for the Eco currency. They specifically address voting open to all token holders for code upgrades to the contract system. Upgrades are managed in terms of proposals which are voted on and may be executed across the span of a generation.

## Table of Contents

- [Community Governance System](#community-governance-system)
  - [Table of Contents](#table-of-contents)
  - [Security](#security)
  - [Background](#background)
  - [Install](#install)
  - [Usage](#usage)
  - [Contract Overview](#contract-overview)
    - [VotingPower](#votingpower)
      - [totalVotingPower](#totalvotingpower)
        - [Return Values](#return-values)
      - [votingPower](#votingpower-1)
        - [Parameters](#parameters)
        - [Return Values](#return-values-1)
    - [ECOxStaking](#ecoxstaking)
      - [Errors](#errors)
        - [NoZeroECOx](#nozeroecox)
        - [NonTransferrable](#nontransferrable)
      - [Events](#events)
        - [Deposit](#deposit)
          - [Parameters](#parameters-1)
        - [Withdrawal](#withdrawal)
          - [Parameters](#parameters-2)
      - [Functions](#functions)
        - [deposit](#deposit-1)
          - [Parameters](#parameters-3)
        - [withdraw](#withdraw)
          - [Parameters](#parameters-4)
        - [votingECOx](#votingecox)
          - [Parameters](#parameters-5)
          - [Return Values](#return-values-2)
        - [totalVotingECOx](#totalvotingecox)
          - [Parameters](#parameters-6)
          - [Return Values](#return-values-3)
        - [transfer](#transfer)
        - [transferFrom](#transferfrom)
    - [Proposal](#proposal)
      - [Functions](#functions-1)
        - [name](#name)
          - [Return Values](#return-values-4)
        - [description](#description)
          - [Return Values](#return-values-5)
        - [url](#url)
          - [Return Values](#return-values-6)
        - [enacted](#enacted)
          - [Parameters](#parameters-7)
    - [CommunityGovernance](#communitygovernance)
      - [Errors](#errors-1)
        - [OnlyPauser](#onlypauser)
        - [WrongStage](#wrongstage)
        - [DuplicateProposal](#duplicateproposal)
        - [OldProposalSupport](#oldproposalsupport)
        - [ArrayLengthMismatch](#arraylengthmismatch)
        - [BadVotingPower](#badvotingpower)
        - [NoSupportToRevoke](#nosupporttorevoke)
        - [BadVoteType](#badvotetype)
        - [NoRefundAvailable](#norefundavailable)
          - [Parameters](#parameters-8)
        - [NoRefundDuringCycle](#norefundduringcycle)
          - [Parameters](#parameters-9)
      - [Events](#events-1)
        - [PauserAssignment](#pauserassignment)
          - [Parameters](#parameters-10)
        - [StageUpdated](#stageupdated)
          - [Parameters](#parameters-11)
        - [ProposalRegistration](#proposalregistration)
          - [Parameters](#parameters-12)
        - [SupportChanged](#supportchanged)
          - [Parameters](#parameters-13)
        - [VotesChanged](#voteschanged)
          - [Parameters](#parameters-14)
        - [ExecutionComplete](#executioncomplete)
          - [Parameters](#parameters-15)
        - [NewCycle](#newcycle)
          - [Parameters](#parameters-16)
        - [FeeRefunded](#feerefunded)
          - [Parameters](#parameters-17)
        - [Sweep](#sweep)
          - [Parameters](#parameters-18)
        - [onlyPauser](#onlypauser-1)
    - [Functions](#functions-2)
      - [setPauser](#setpauser)
        - [Parameters](#parameters-19)
      - [pause](#pause)
      - [updateStage](#updatestage)
      - [nextCycle](#nextcycle)
      - [propose](#propose)
        - [Parameters](#parameters-20)
      - [support](#support)
        - [Parameters](#parameters-21)
      - [supportPartial](#supportpartial)
        - [Parameters](#parameters-22)
      - [unsupport](#unsupport)
        - [Parameters](#parameters-23)
      - [\_changeSupport](#_changesupport)
        - [Parameters](#parameters-24)
      - [getSupport](#getsupport)
        - [Parameters](#parameters-25)
      - [vote](#vote)
        - [Parameters](#parameters-26)
      - [votePartial](#votepartial)
        - [Parameters](#parameters-27)
      - [\_vote](#_vote)
      - [getVotes](#getvotes)
        - [Parameters](#parameters-28)
        - [Return Values](#return-values-7)
      - [execute](#execute)
      - [refund](#refund)
        - [Parameters](#parameters-29)
      - [sweep](#sweep-1)
        - [Parameters](#parameters-30)
  - [Contributing](#contributing)
  - [License](#license)

## Security

The security of community governance is built off of the network effect of requiring a significant percentage of token holder consensus at each step of the way. The security of balances to enforce this consensus is maintained by the checkpointing system detailed in the currency readme [here](../../currency/README.md#votecheckpoints).

## Background

The process of the Community Governance vote is set to the global Generation Cycle of 14 days. During the first phase (up to 9 days), Proposals can be submitted and users may perform a signal vote for each one. If any proposal succeeds the signal vote threshold, the initial phase ends and a voting phase immediately starts (lasting 3 days). After the voting phase is finished, there is a delay period of 1 day before enaction (if the proposal passed). There is an execution period which lasts until the end of the cycle + 1 day. If at any time during this period, the proposal is executed then the cycle is marked as done and the end time is changed back to the cycle end time. This means if the proposal is executed after the end of when the cycle would normally end, the proposing can start immediately.

_Note: the new cycle start time and end time is always calculated off of the start of the previous cycle._

## Install

See the [main README](../../../README.md) for installation instructions.

## Usage

The [CommunityGovernance](../../../docs/solidity/governance/community/CommunityGovernance.md) contract handles the vote process.

All the state is managed in the CommunityGovernance contract, which contains an enum of the stages possible and rules for changing between stages.

CommunityGovernance timings are flexible. Removing the monotonic generation timer means that incrementing the generation doesn’t necessarily need to happen on a specific cadence. The voting cycle can automatically renew each time a proposal passes.

Addition of getter/setter functions where necessary Permission based authorization functionality will need to be implemented in each relevant contract.

Voting ability calculation is implemented in the `VotingPower` contract. Ability to vote with ECOx is managed by the `ECOxStaking` contract. Sample proposals all follow the format of the `Proposal` contract and will not be discussed individually.

## Contract Overview

For detailed API documentation see [community](../../../docs/solidity/governance/community/)

### [VotingPower](../../../docs/solidity/governance/community/VotingPower.md)

- Inherits: [Policied](../../../docs/solidity/policy/Policed.md),[ECO](../../../docs/solidity/currency/ECO.md), [ECOx](../../../docs/solidity/currency/ECOx.md), [ECOxStaking](../../../docs/solidity/governance/community/ECOxStaking.md)

This contract is for [CommunityGovernance](../../../docs/solidity/governance/community/CommunityGovernance.md) to inherit the functionality for computing voting power for any address. The voting power calculation combines the amount of ECO in the last checkpoint before the voting process starts with the same checkpoint for qualified amounts of ECOx. Each wei of ECO has 1 voting power, and each wei ECOx has 10 voting power. These voting weights presume the initial supply of ECO is ten times bigger than the initial supply of ECOx -- meaning that at genesis, ECO and ECOx have equal contributions to total voting power. See the [currency](../../currency/README.md#votecheckpoints) documentation for more explanation about the checkpointing system and see [ECOxStaking](./README.md#ecoxstaking) in this readme to see what qualifies ECOx for voting.

#### totalVotingPower

Calculates the total Voting Power by getting the total supply of ECO
and adding total ECOX (multiplied by 10) and subtracting the excluded Voting Power

```solidity
function totalVotingPower() public view returns (uint256 total)
```

##### Return Values

| Name  | Type    | Description            |
| ----- | ------- | ---------------------- |
| total | uint256 | the total Voting Power |

#### votingPower

Calculates the voting power for an address at the Snapshot Block

```solidity
function votingPower(address _who) public view returns (uint256 total)
```

##### Parameters

| Name  | Type    | Description                                   |
| ----- | ------- | --------------------------------------------- |
| \_who | address | the address to calculate the voting power for |

##### Return Values

| Name  | Type    | Description                                                  |
| ----- | ------- | ------------------------------------------------------------ |
| total | uint256 | the total vorting power for an address at the Snapshot Block |

### ECOxStaking

- Inherits: `IERC20`, [VoteCheckpoints](../../../docs/solidity/currency/VoteCheckpoints.md), [ECOx](../../../docs/solidity/currency/ECOx.md), [PolicedUpgradeable](../../../docs/solidity/policy/PolicedUpgradeable.md)

This contract is used to stake ECOx for the sake of voting with it in community governance. The quantity of EcoX locked up is the amount added to the individual's voting power. A [checkpointing system](../../currency/README.md#votecheckpoints) with delegation is used that is identical to the `ECO` contract. The stored ECOx (sECOx) cannot be transferred.

#### Errors

##### NoZeroECOx

error for if the constructor tries to set the ECOx address to zero

```solidity
error NoZeroECOx()
```

##### NonTransferrable

error for if any transfer function is attempted to be used

```solidity
error NonTransferrable()
```

#### Events

##### Deposit

The Deposit event indicates that ECOx has been locked up, credited
to a particular address in a particular amount.

```solidity
event Deposit(address source, uint256 amount)
```

###### Parameters

| Name   | Type    | Description                                                |
| ------ | ------- | ---------------------------------------------------------- |
| source | address | The address that a deposit certificate has been issued to. |
| amount | uint256 | The amount of ECOx tokens deposited.                       |

##### Withdrawal

The Withdrawal event indicates that a withdrawal has been made to a particular
address in a particular amount.

```solidity
event Withdrawal(address destination, uint256 amount)
```

###### Parameters

| Name        | Type    | Description                                                          |
| ----------- | ------- | -------------------------------------------------------------------- |
| destination | address | The address that has made a withdrawal.                              |
| amount      | uint256 | The amount in basic unit of 10^{-18} ECOx (weicoX) tokens withdrawn. |

#### Functions

##### deposit

deposit transfers ECOx to the contract and mints sECOx to the source of the transfer determined by `msg.sender`.

```solidity
function deposit(uint256 _amount) external
```

###### Parameters

| Name     | Type    | Description                   |
| -------- | ------- | ----------------------------- |
| \_amount | uint256 | the amount of ECOx to deposit |

##### withdraw

withdraw burns the senders sECOx and transfers ECOx to the source of the transfer determined by `msg.sender`.

```solidity
function withdraw(uint256 _amount) external
```

###### Parameters

| Name     | Type    | Description                    |
| -------- | ------- | ------------------------------ |
| \_amount | uint256 | the amount of ECOx to withdraw |

##### votingECOx

Gets the past votes for a voter at a specific block

```solidity
function votingECOx(address _voter, uint256 _blockNumber) external view returns (uint256 pastVotes)
```

###### Parameters

| Name          | Type    | Description                                 |
| ------------- | ------- | ------------------------------------------- |
| \_voter       | address | the address of the voter                    |
| \_blockNumber | uint256 | the block number to retrieve the votes from |

###### Return Values

| Name      | Type    | Description                        |
| --------- | ------- | ---------------------------------- |
| pastVotes | uint256 | the past votes at the block number |

##### totalVotingECOx

Gets the total supply at a specific block number

```solidity
function totalVotingECOx(uint256 _blockNumber) external view returns (uint256 totalSupply)
```

###### Parameters

| Name          | Type    | Description                    |
| ------------- | ------- | ------------------------------ |
| \_blockNumber | uint256 | the block to get the votes for |

###### Return Values

| Name        | Type    | Description                          |
| ----------- | ------- | ------------------------------------ |
| totalSupply | uint256 | the total supply at the block number |

##### transfer

transfers are disabled and revert with a NonTransferrable error

```solidity
function transfer(address, uint256) public pure returns (bool)
```

##### transferFrom

transferFroms are disabled and revert with a NonTransferrable error

```solidity
function transferFrom(address, address, uint256) public pure returns (bool)
```

### [Proposal](../../../docs/solidity/governance/community/proposals/Proposal.md)

Interface specification for proposals. Any proposal submitted in the policy decision process must implement this interface.

#### Functions

##### name

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() external view returns (string name)
```

###### Return Values

| Name | Type   | Description              |
| ---- | ------ | ------------------------ |
| name | string | The name of the proposal |

##### description

A longer description of what this proposal achieves.

```solidity
function description() external view returns (string description)
```

###### Return Values

| Name        | Type   | Description                                          |
| ----------- | ------ | ---------------------------------------------------- |
| description | string | A longer description of what this proposal achieves. |

##### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() external view returns (string url)
```

###### Return Values

| Name | Type   | Description                                                          |
| ---- | ------ | -------------------------------------------------------------------- |
| url  | string | A URL where voters can go to see the case in favour of this proposal |

##### enacted

Called to enact the proposal.

This will be called from the root policy contract using delegatecall,
with the direct proposal address passed in as \_self so that storage
data can be accessed if needed.

```solidity
function enacted(address _self) external
```

###### Parameters

| Name   | Type    | Description                           |
| ------ | ------- | ------------------------------------- |
| \_self | address | The address of the proposal contract. |

### [CommunityGovernance](../../../docs/solidity/governance/community/CommunityGovernance.md)

- Inherits: `Pausable`, [VotingPower](../../../docs/solidity/governance/community/VotingPower.md), [ECOxStaking](../../../docs/solidity/governance/community/ECOxStaking.md), [Proposal](../../../docs/solidity/governance/community/proposals/Proposal.md)

CommunityGovernance manages the stages, proposals, and voting of the community governance contract.

- This removes the need for cloning and rebinding that happen each generation and during the generation increment. Instead, all the state is managed in the CommunityGovernance contract, which contains an enum of the stages possible and rules for changing between stages.
- CommunityGovernance timings are flexible.
  - Removing the monotonic generation timer means that incrementing the generation doesn’t necessarily need to happen on a specific cadence. The voting cycle can automatically renew each time a proposal passes.
- Addition of getter/setter functions where necessary
  - Permission based authorization functionality will need to be implemented in each relevant contract.

#### Errors

##### OnlyPauser

thrown when non-pauser tries to call pause without permission

```solidity
error OnlyPauser()
```

##### WrongStage

thrown when a call is made during the wrong stage of Community Governance

```solidity
error WrongStage()
```

##### DuplicateProposal

thrown when a proposal that already exists is proposed again

```solidity
error DuplicateProposal()
```

##### OldProposalSupport

thrown when there is an attempt to support a proposal submitted in a non-current cycle

```solidity
error OldProposalSupport()
```

##### ArrayLengthMismatch

thrown when related argument arrays have differing lengths

```solidity
error ArrayLengthMismatch()
```

##### BadVotingPower

thrown when the voting power of a support or vote action is invalid

```solidity
error BadVotingPower()
```

##### NoSupportToRevoke

thrown when unsupport is called without the caller having supported the proposal

```solidity
error NoSupportToRevoke()
```

##### BadVoteType

thrown when vote is called with a vote type other than enact, reject, abstain

```solidity
error BadVoteType()
```

##### NoRefundAvailable

thrown when refund is called on a proposal for which no refund is available

```solidity
error NoRefundAvailable(address proposal)
```

###### Parameters

| Name     | Type    | Description                             |
| -------- | ------- | --------------------------------------- |
| proposal | address | the proposal whose refund was attempted |

##### NoRefundDuringCycle

thrown when refund is called on a proposal that was submitted in the current cycle

```solidity
error NoRefundDuringCycle(address proposal)
```

###### Parameters

| Name     | Type    | Description                             |
| -------- | ------- | --------------------------------------- |
| proposal | address | the proposal whose refund was attempted |

#### Events

##### PauserAssignment

event indicating the pauser was updated

```solidity
event PauserAssignment(address pauser)
```

###### Parameters

| Name   | Type    | Description    |
| ------ | ------- | -------------- |
| pauser | address | The new pauser |

##### StageUpdated

event indicating a change in the community governance stage

```solidity
event StageUpdated(enum CommunityGovernance.Stage stage)
```

###### Parameters

| Name  | Type                           | Description   |
| ----- | ------------------------------ | ------------- |
| stage | enum CommunityGovernance.Stage | the new stage |

##### ProposalRegistration

An event indicating a proposal has been registered

```solidity
event ProposalRegistration(address proposer, contract Proposal proposal)
```

###### Parameters

| Name     | Type              | Description                                                  |
| -------- | ----------------- | ------------------------------------------------------------ |
| proposer | address           | The address that submitted the proposal                      |
| proposal | contract Proposal | The address of the proposal contract instance that was added |

##### SupportChanged

An event indicating a change in support for a proposal

```solidity
event SupportChanged(address supporter, contract Proposal proposal, uint256 oldSupport, uint256 newSupport)
```

###### Parameters

| Name       | Type              | Description                                                  |
| ---------- | ----------------- | ------------------------------------------------------------ |
| supporter  | address           | The address that submitted the proposal                      |
| proposal   | contract Proposal | The address of the proposal contract instance that was added |
| oldSupport | uint256           | The previous amount of support                               |
| newSupport | uint256           | The new amount of support                                    |

##### VotesChanged

An event indicating a vote cast on a proposal

```solidity
event VotesChanged(address voter, uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes)
```

###### Parameters

| Name         | Type    | Description               |
| ------------ | ------- | ------------------------- |
| voter        | address | The address casting votes |
| enactVotes   | uint256 | The votes to enact        |
| rejectVotes  | uint256 | The votes to reject       |
| abstainVotes | uint256 | The votes to abstain      |

##### ExecutionComplete

An event indicating that the proposal selected for this governance cycle was successfully executed

```solidity
event ExecutionComplete(address proposal)
```

###### Parameters

| Name     | Type    | Description                    |
| -------- | ------- | ------------------------------ |
| proposal | address | The proposal that was executed |

##### NewCycle

An event indicating that a new cycle has begun

```solidity
event NewCycle(uint256 cycleNumber)
```

###### Parameters

| Name        | Type    | Description      |
| ----------- | ------- | ---------------- |
| cycleNumber | uint256 | the cycle number |

##### FeeRefunded

An event indicating that the fee for a proposal was refunded

```solidity
event FeeRefunded(address proposal, address proposer, uint256 refund)
```

###### Parameters

| Name     | Type    | Description                                |
| -------- | ------- | ------------------------------------------ |
| proposal | address | The address of the proposal being refunded |
| proposer | address | The address that registered the proposal   |
| refund   | uint256 | The amount of tokens refunded to proposer  |

##### Sweep

An event indicating that the leftover funds from fees were swept to a recipient address

```solidity
event Sweep(address recipient)
```

###### Parameters

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| recipient | address | the recipient address |

##### onlyPauser

```solidity
modifier onlyPauser()
```

### Functions

##### setPauser

sets the pauser of community governance

```solidity
function setPauser(address _pauser) public
```

###### Parameters

| Name     | Type    | Description    |
| -------- | ------- | -------------- |
| \_pauser | address | the new pauser |

##### pause

Pauses community governance

```solidity
function pause() external
```

##### updateStage

updates the current stage
called by methods propose, vote, and execute.

```solidity
function updateStage() public
```

##### nextCycle

moves community governance to the next cycle

```solidity
function nextCycle() internal
```

##### propose

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

###### Parameters

| Name       | Type              | Description                                                                                                                                                        |
| ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \_proposal | contract Proposal | the address of the deployed proposal fee is only levied if community governance is paused - we want to still be usable in the event that ECO transfers are paused. |

##### support

allows an address to register its full voting power in support of a proposal

```solidity
function support(address _proposal) public
```

###### Parameters

| Name       | Type    | Description                             |
| ---------- | ------- | --------------------------------------- |
| \_proposal | address | the address of proposal to be supported |

##### supportPartial

allows an address to register partial support for a set of proposals

```solidity
function supportPartial(address[] _proposals, uint256[] _allocations) public
```

###### Parameters

| Name          | Type      | Description                                                                                                                                                                                                                                |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \_proposals   | address[] | the array of proposals to be supported                                                                                                                                                                                                     |
| \_allocations | uint256[] | the respective voting power to put behind those proposals \_changeSupport overwrites the previous supporting voting power, so having the same proposal multiple times in the_proposals array will not result in double counting of support |

##### unsupport

allows an address to revoke support for a proposal

```solidity
function unsupport(address _proposal) public
```

###### Parameters

| Name       | Type    | Description                             |
| ---------- | ------- | --------------------------------------- |
| \_proposal | address | the address of proposal to be supported |

##### \_changeSupport

allows an address to change the support amount for a proposal

```solidity
function _changeSupport(address supporter, address proposal, uint256 amount) internal
```

###### Parameters

| Name      | Type    | Description                                                       |
| --------- | ------- | ----------------------------------------------------------------- |
| supporter | address | the adress of the supporter that is changing their support amount |
| proposal  | address | the proposal for which the amount is being changed                |
| amount    | uint256 | the new support amount                                            |

##### getSupport

fetches the voting power with which a given address supports a given proposal

```solidity
function getSupport(address supporter, address proposal) public view returns (uint256 theSupport)
```

###### Parameters

| Name      | Type    | Description                                                                                         |
| --------- | ------- | --------------------------------------------------------------------------------------------------- |
| supporter | address | the supporting address                                                                              |
| proposal  | address | the proposal 8 @return theSupport voting power with which a given address supports a given proposal |

##### vote

allows an address to vote to enact, reject or abstain on a proposal with their full voting power

```solidity
function vote(enum CommunityGovernance.Vote choice) public
```

###### Parameters

| Name   | Type                          | Description       |
| ------ | ----------------------------- | ----------------- |
| choice | enum CommunityGovernance.Vote | the address' vote |

##### votePartial

allows an address to split their voting power allocation between enact, reject and abstain

```solidity
function votePartial(uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes) public
```

###### Parameters

| Name         | Type    | Description      |
| ------------ | ------- | ---------------- |
| enactVotes   | uint256 | votes to enact   |
| rejectVotes  | uint256 | votes to reject  |
| abstainVotes | uint256 | votes to abstain |

##### \_vote

```solidity
function _vote(address voter, uint256 _enactVotes, uint256 _rejectVotes, uint256 _abstainVotes) internal
```

##### getVotes

fetches the votes an address has pledged toward enacting, rejecting, and abstaining on a given proposal

```solidity
function getVotes(address voter) public view returns (uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes)
```

###### Parameters

| Name  | Type    | Description            |
| ----- | ------- | ---------------------- |
| voter | address | the supporting address |

###### Return Values

| Name         | Type    | Description                        |
| ------------ | ------- | ---------------------------------- |
| enactVotes   | uint256 | Votes for enacting the policy      |
| rejectVotes  | uint256 | Votes for rejecting the policy     |
| abstainVotes | uint256 | Votes for abstaining on the policy |

##### execute

allows an address to enact a selected proposal that has passed the vote
it is important to do this in a timely manner, once the cycle passes it will no longer be possible to execute the proposal.
the community will have a minimum of 3 days 8 hours to enact the proposal.

```solidity
function execute() public
```

##### refund

allows redemption of proposal registration fees

```solidity
function refund(address proposal) public
```

###### Parameters

| Name     | Type    | Description                                                                                                                       |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| proposal | address | the proposal whose fee is being redeemed the fee will be refunded to the proposer of the proposal, regardless of who calls refund |

##### sweep

allows the leftover registration fees to be drained from the contract

```solidity
function sweep(address recipient) public
```

###### Parameters

| Name      | Type    | Description                                                             |
| --------- | ------- | ----------------------------------------------------------------------- |
| recipient | address | the address receiving the tokens only the policy contract can call this |

## Contributing

See the [main README](../../../README.md).

## License

See the [main README](../../../README.md).
