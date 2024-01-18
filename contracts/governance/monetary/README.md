# Monetary Governance System

> Monetary governance policies for the Eco currency.

These contracts provide the monetary policy system for the Eco currency. They specify how the currency is to be managed, and what economic processes are enacted.

## Table of Contents

- [Monetary Governance System](#monetary-governance-system)
  - [Table of Contents](#table-of-contents)
  - [Security](#security)
  - [Background](#background)
    - [Monetary Policy Decisions](#monetary-policy-decisions)
      - [Random Inflation](#random-inflation)
      - [Lockups](#lockups)
      - [Linear Inflation/Deflation](#linear-inflationdeflation)
  - [Install](#install)
  - [Usage](#usage)
  - [Contract Overview](#contract-overview)
    - [TimeUtils](#timeutils)
      - [Functions](#functions)
    - [Policy](#policy)
    - [Policied](#policied)
    - [Notifier](#notifier)
    - [Lever](#lever)
    - [Lockups](#lockups-1)
    - [Rebase](#rebase)
    - [TrustedNodesFactory](#trustednodesfactory)
    - [TrustedNodes](#trustednodes)
    - [CurrencyGovernance](#currencygovernance)
    - [MonetaryPolicyAdapter](#monetarypolicyadapter)
  - [Contributing](#contributing)
  - [License](#license)

## Security

The security of the governance contracts is built on a list of trustees. See the `TrustedNodes` contract for how the list maintained. Changes to the list of trustees can be only be made using policy proposals, and require the support of a majority of participating voters, weighted by stake.

## Background

The trustee and monetary governance contracts provide an iterating economic system. It allows Eco's trustees (a list of which is managed by the `TrustedNodes` contract) to enact inflationary or deflationary measures.

The `CurrencyGovernance` contract implements the governmental decisionmaking process, and records the results of the vote. Only the trustees may participate in the `CurrencyGovernance` contract's proposal and voting process.

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

## Contract Overview

For detailed API documentation see [monetary](../../../docs/solidity/governance/monetary/)

### [TimeUtils](../../../docs/solidity/utils/TimeUtils.md)

Utility class for time, allowing easy unit testing.

#### Functions

##### getTime

Determine the current time as perceived by the policy timing contract.

Used extensively in testing, but also useful in production for
determining what processes can currently be run.

```solidity
function getTime() internal view returns (uint256 blockTimeStamp)
```

###### Return Values

| Name           | Type    | Description                 |
| -------------- | ------- | --------------------------- |
| blockTimeStamp | uint256 | The current block timestamp |

### [Policy](../../../docs/solidity/policy/Policy.md)

- Inherits [ForwardTarget](../../../docs/solidity/proxy/ForwardTarget.md)

The policy contract that oversees other contracts. Policy contracts provide a mechanism for building pluggable (after deploy) governance systems for other contracts.

### [Policied](../../../docs/solidity/policy/Policied)

- Inherits [Policy](../../../docs/solidity/policy/Policy.md)

A policed contract is any contract managed by a policy.

### [Notifier](../../../docs/solidity/governance/monetary/Notifier.md)

- Inherits [Policied](../../../docs/solidity/policy/Policied), [Policy](../../../docs/solidity/policy/Policy.md)

This contract notifies downstream contracts of actions taken by the attached monetary policyvlevers.

Calls made to these downstream contracts are non-atomic with the lever actions themselves, allowing the levers to operate as expected even if the notifier calls fail.

### [Lever](../../../docs/solidity/governance/monetary/Lever.md)

- Inherits [Policy](../../../docs/solidity/policy/Policy.md), [Policied](../../../docs/solidity/policy/Policied), [Policy](../../../docs/solidity/policy/Policy.md), [Notifier](../../../docs/solidity/governance/monetary/Notifier.md)

This contract is a generic monetary policy lever and is inherited by all lever implementations.

### [Lockups](../../../docs/solidity/governance/monetary/Lockups.md)

- Inherits [ECO](../../../docs/solidity/currency/ECO.md), [Notifier](../../../docs/solidity/governance/monetary/Notifier.md), [Lever](../../../docs/solidity/governance/monetary/Lever.md), [TimeUtils](../../../docs/solidity/utils/TimeUtils.md)

This provides deposit certificate functionality for the purpose of countering inflationary effects.

Deposits can be made and interest will be paid out to those who make deposits. Deposit principal is accessable before the interested period but for a penalty of not retrieving your gained interest as well as an additional penalty of that same amount.

### [Rebase](../../../docs/solidity/governance/monetary/Rebase.md)

- Inherits [ECO](../../../docs/solidity/currency/ECO.md), [Notifier](../../../docs/solidity/governance/monetary/Notifier.md), [Lever](../../../docs/solidity/governance/monetary/Lever.md)

This contract is a monetary policy lever that rebases the eco currency in accordance with the decision made by the slate of trustees.

### [TrustedNodesFactory](../../../docs/solidity/governance/monetary/TrustedNodesFactory.md)

- Inherits [CurrencyGovernance](../../../docs/solidity/governance/monetary/CurrencyGovernance.md), [ECOx](../../../docs/solidity/currency/ECOx.md)

This factory contract is used to deploy new TrustedNodes contracts.

### [TrustedNodes](../../../docs/solidity/governance/monetary/TrustedNodes.md)

- Inherits [Policied](../../../docs/solidity/policy/Policied), [ECOx](../../../docs/solidity/currency/ECOx.md), [TimeUtils](../../../docs/solidity/utils/TimeUtils.md), [CurrencyGovernance](../../../docs/solidity/governance/monetary/CurrencyGovernance.md)

A registry of trusted nodes. Trusted nodes (trustees) are able to vote on monetary policy and can only be added or removed using community governance.

### [CurrencyGovernance](../../../docs/solidity/governance/monetary/CurrencyGovernance.md)

- Inherits [TrustedNodes](../../../docs/solidity/governance/monetary/TrustedNodes.md), [MonetaryPolicyAdapter](../../../docs/solidity/governance/monetary/MonetaryPolicyAdapter.md), [TimeUtils](../../../docs/solidity/utils/TimeUtils.md), [Policied](../../../docs/solidity/policy/Policied)

This contract oversees the voting on the currency monetary levers.Trustees vote on a policy that is implemented at the conclusion of the cycle

### [MonetaryPolicyAdapter](../../../docs/solidity/governance/monetary/MonetaryPolicyAdapter.md)

- Inherits [Policied](../../../docs/solidity/policy/Policied), [Policy](../../../docs/solidity/policy/Policy.md), [CurrencyGovernance](../../../docs/solidity/governance/monetary/CurrencyGovernance.md)

This contract enacts the results of the currency governance
Its goal is to act as a long term address to pemission to allow execution of trustee governance and as a long term reference for event indexing of the results.

This module can be replaced, but it eases the difficulty of the potentially more frequent changes to the CurrencyGovernance contract

## Contributing

See the [main README](../../../README.md).

## License

See the [main README](../../../README.md).
