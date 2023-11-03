# Monetary Governance System

> Monetary governance policies for the Eco currency.

These contracts provide the monetary policy system for the Eco currency. They specify how the currency is to be managed, and what economic processes are enacted.

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Security

The security of the governance contracts is built on a list of trustees. See the `TrustedNodes` contract for how the list maintained. Changes to the list of trustees can be only be made using policy proposals, and require the support of a majority of participating voters, weighted by stake.

## Background

The trustee and monetary governance contracts provide an iterating economic system. It allows Eco's trustees (a list of which is managed by the `TrustedNodes` contract) to enact inflationary or deflationary measures.

The `CurrencyGovernance` contract implements the governmental decisionmaking process, and records the results of the vote for the [CurrencyTimer](../README.md#currencytimer) contract to enact. Only the trustees may participate in the `CurrencyGovernance` contract's proposal and voting process.

The `TrustedNodes` contract manages the list of trustees as well as their rewards for participation in the monetary policy votes. The list of trusted nodes can be updated in a couple of different ways and there are example proposals in the [community governance](../community/) folder to show some suggested paths.

### Monetary Policy Decisions

The rest of the contracts are implementations of monetary Policy decisions. They're used to create and distribute new currency (to drive spending), to create and distribute lockup contracts (to discourage spending). Additionally, trustees may scale the currency across the board (to manage exchange value with other currencies), but this process is managed by the `ECO` contract. The different policy levers are designed to reward different behavior and provide incentives to achieve their desired results.

#### Random Inflation

A random inflation policy decision creates new currency and distributes it randomly to anyone who had votable ECO (not ECOx) at the end of the last generation. No registration is required, and probability of receiving a share of the newly minted currency is weighted by balance held.

#### Lockups

Deflation (or a similar slowing of the economy) is achieved by issuing lockup contracts that produce more ECO. These lockups are made available for a 48 hour window after the generation starts, and the participants receive newly created currency as rewards for their deposits when they retrieve their funds at the end of the lockup duration.

#### Linear Inflation/Deflation

This policy lever scales the balance for every single address by the same percentage amount. It increases or decreases the total supply while leaving the relative purchasing power of each user, relative to each other, the same. This can be used to change the unit value of ECO when compared to other currencies as an example. See the [InflationCheckpoints](../../currency/README.md#inflationcheckpoints) contract for documentation.

## Install

See the [main README](../../../README.md) for installation instructions.

## Usage

The governance contracts deploy as a policy hierarchy implemented in Eco's [policy framework](../policy/README.md). The [CurrencyTimer](../README.md#currencytimer) contract clones all the relevant contracts each generation to manage and enact the different policies.

The `CurrencyGovernance` contract is cloned to run the decisionmaking process. This process runs in 3 phases. First is a 10 day period over which trustees each can submit their proposals for new values for the 3 monetary policy levers. Then there is a 3 day phase in which the trustees create ballots ranking the proposals using a partial Borda Count method and submit them in the form of a hash commit. Finally there is a 1 day phase where votes are revealed and counted ending in a winner being chosen and applied as the next generation starts.

## API

For detailed API documentation see [monetary](../../../docs/solidity/governance/monetary/)

### [CurrencyGovernance](../../../docs/solidity/governance/monetary/CurrencyGovernance.md)

- Inherits: `PolicedUtils`, `TimeUtils`, `Pausable`

This is the trustee monetary policy decision-making contract. It acts as a venue to both propose and vote on policy decisions. It is cloned for use by the `CurrencyTimer` contract and most of its functionality only works if cloned, denoting an active voting process whose progress is tracked in the `stage` enum which denotes the phase of the voting.

Proposals are submitted by trustees calling `propose` with their desired values for the different monetary policy levers. These proposal structs are stored in the mapping `proposals` which maps the submitting trustee address (the key for the proposal for the whole voting process) to the struct that holds their proposed values. Trustees my withdraw and modify their proposals at any point during the `Propose` phase. Along with the proposed votes, a 'default proposal' exists that enacts no change to the currency.

Once the `Propose` stage (first 10 days of a generation) completes, the submitted proposals move on to a partial Borda voting phase. A Borda vote is one where the voter submits a ranked choice ballot ranking all of the options. Then each choice is given n - i votes where n is the number of options and i is the position on the ballot (rank first is i = 0, ranked second is i = 1 and so on). In the partial Borda vote, the calculation is similar, except the voter my rank as many options as they choose, and then n is instead the number of options that were ranked on the submitted ballot. As a default, all trustees are considered to have an initial single vote for the default proposal. This default vote is replaced by their submitted vote if they successfully submit and reveal.

Votes are submitted via a hash commit of an ordered list of addresses corresponding to each proposal (its submitter, as specified above). One the 3 day period for submitting vote hash commits is done, the trustees must reveal their votes by calling `reveal` with a list of addresses that matches their hash commit. During this period, the `leader` variable, storing the address that corresponds to the leading proposal is updated on each reveal. The leader is selected as the proposal with the most votes. In case of a tie, the leader would be the proposal that has the greatest number of points in the previous vote and is tied in the current.

The reveal phase is followed by a 1 day compute phase that finalizes the `winner` in an event and moves the contract into a dormant, `Finished` `stage`. The contract is thereon forward used as a lookup point for the values of the winning proposal.

### [Lockups](../../../docs/solidity/governance/monetary/Lockups.md)

- Inherits: `PolicedUtils`, `TimeUtils`

Provides deposit certificate functionality, used to slow down the rate of spending. Is a template contract that is cloned and initialized when it is offered (as the result of a `CurrencyGovernance` vote) by the `CurrencyTimer` contract on the start of a new generation.

The deposit certificates system operates in three parts. First, during the sale period, currency holders are able to make deposits. Then, during the lockup period, deposit holders are able to withdraw but at a penalty. Finally, at the end of the lockup period deposit holders are able to withdraw their initial deposit along with the promised interest.

Interest is stored as a 9 digit fixed point number and is calculated via integer multiplication and truncated division.

### [TrustedNodes](../../../docs/solidity/governance/monetary/TrustedNodes.md)

- Inherits: `PolicedUtils`

Provides a registry of trustees, and allows the root policy contract to grant or revoke trust. Trusted nodes participate in the inflation/deflation voting process. They can be added and removed using policy proposals.

## Contributing

See the [main README](../../../README.md).

## License

See the [main README](../../../README.md).
