# Community Governance System

> Community governance policies for the Eco currency.

These contracts provide the community governance system for the Eco currency. They specifically address voting open to all token holders for code upgrades to the contract system. Upgrades are managed in terms of proposals which are voted on and may be executed over the course of a repeating voting cycle.

## Table of Contents

- [Community Governance System](#community-governance-system)
  - [Table of Contents](#table-of-contents)
  - [Security](#security)
  - [Background](#background)
  - [Install](#install)
  - [Usage](#usage)
  - [Contract Overview](#contract-overview)
    - [VotingPower](#votingpower)
    - [ECOxStaking](#ecoxstaking)
    - [Proposal](#proposal)
    - [CommunityGovernance](#communitygovernance)
  - [Contributing](#contributing)
  - [License](#license)

## Security

The security of community governance is built off of the network effect of requiring a significant percentage of token holder consensus at each step of the way. The security of balances to enforce this consensus is maintained by the snapshotting system detailed in the currency readme [here](../../currency/README.md#votecheckpoints).

## Background

The process of the Community Governance vote is set to a Cycle duration of 14 days. During the first phase (last up to the first 9 days of a cycle), Proposals can be submitted and users may perform a signal vote for each one. If any proposal succeeds the signal vote threshold, the initial phase ends and a voting phase immediately starts (lasting 3 days). After the voting phase is finished, there is a delay period of 1 day before enaction (if the proposal passed). If the vote passes, there is an execution period which lasts until the end of the cycle + 1 day. If at any time during this period, the proposal is executed then the cycle is marked as done and the end time is changed back to the cycle end time. This means if the proposal is executed after the end of when the cycle would normally end but before the execution window ends, the proposing can start immediately.

_Note: the new cycle start time and end time is always calculated off of the start of the previous cycle._

## Install

See the [main README](../../../README.md) for installation instructions.

## Usage

The [CommunityGovernance](../../../docs/solidity/governance/community/CommunityGovernance.md) contract handles the vote process.

All the state is managed in the CommunityGovernance contract, which contains an enum of the stages possible and rules for changing between stages.

CommunityGovernance timings are flexible. Removing the monotonic generation timer means that community governance is only reliant on its own timing calculation.

Vote calculation is implemented in the `VotingPower` contract. Ability to vote with ECOx is managed by the `ECOxStaking` contract. Sample proposals all follow the format of the `Proposal` contract and will not be discussed individually.

## Contract Overview

For detailed API documentation see [community](../../../docs/solidity/governance/community/)

### [VotingPower](../../../docs/solidity/governance/community/VotingPower.md)

- Inherits: [Policied](../../../docs/solidity/policy/Policed.md)

This contract is for [CommunityGovernance](../../../docs/solidity/governance/community/CommunityGovernance.md) to inherit the functionality for computing voting power for any address. The voting power calculation combines the amount of ECO in the last checkpoint before the voting process starts with the same checkpoint for qualified amounts of ECOx. Each wei of ECO has 1 voting power, and each wei ECOx has 10 voting power. See the [currency](../../currency/README.md#votecheckpoints) documentation for more explanation about the checkpointing system and see [ECOxStaking](./README.md#ecoxstaking) in this readme to see how ECOx is staked for voting.

### ECOxStaking

- Inherits: `IERC20`, [VoteCheckpoints](../../../docs/solidity/currency/VoteCheckpoints.md), [PolicedUpgradeable](../../../docs/solidity/policy/PolicedUpgradeable.md)

This contract is used to stake ECOx for the sake of voting with it in community governance. The quantity of ECOx locked up is the amount used to calculate the individual's voting power. A [checkpointing system](../../currency/README.md#votecheckpoints) with delegation is unchanged from the initial implmenetation and marks the block of each stake and unstake event. The stored ECOx (sECOx) cannot be transferred.

### [Proposal](../../../docs/solidity/governance/community/proposals/Proposal.md)

Interface specification for proposals. Any proposal submitted in the policy decision process must implement this interface. The content of the `enacted` function is what is run on successful proposal.

### [CommunityGovernance](../../../docs/solidity/governance/community/CommunityGovernance.md)

- Inherits: [VotingPower](../../../docs/solidity/governance/community/VotingPower.md), `Pausable`, [TimeUtils](../../../docs/solidity/utils/TimeUtils.md)

CommunityGovernance manages the stages, proposals, and voting of the community governance contract. Proposals are submitted for a fee of 10000 ECO. If the proposal is successfully voted through, the fee is refunded. The start of the voting cycle, usually triggered by submitting a proposal, commits the block of the snapshot for voting power's sake. If the proposal is not picked up or unsuccessful, a refund of 5000 ECO can be collected. An address can support any number of proposals, each given the snapshotted voting power in support. If a proposal recieves support equal to 15% of the total voting power in the snapshot, the voting phase begins. If no proposal recieves enough support within the first 9 days of a cycle, the proposals are no longer valid and proposing starts in 5 additional days (the end of the 14 day voting cycle). If a proposal is supported enough to be voting on, immediately there starts a 3 day period for voting. Voting can be for or against the proposal or an abstention. Votes (likely votes coming from voting collectives) may be split between yes, no, and abstension. At the end of the voting period, the percentage of yes to no votes submitted decides if the vote passes. Then there is a 1 day delay period and after that the proposal may be executed up until 1 day past the end of the 14 day cycle. If at any point during the voting, a total majority of more than 50% of the total available voting power is cast in favor, voting ends and execution may be done immediately. If there are more no votes than yes votes, the cycle is marked Done after the voting period and submission may begin again at the start of the next cycle.

## Contributing

See the [main README](../../../README.md).

## License

See the [main README](../../../README.md).
