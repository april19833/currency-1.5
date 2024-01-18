# Eco Policy Contract Framework

> The Eco Policy Framework

The contracts in this directory provide the basis for the Eco Policy Framework. The Policy Framework ("policies") allow the management of some abstract set of contracts by an arbitrary oversight process. The Policy Framework can execute arbitrary code in the context of any contract under its management through the [Community Governance](../governance/community/README.md) process. This allows recovery from nearly any situation so long as the system itself is not compromised, and when combined with the proxy framework facilitates contract upgrades (see below for an example). In general, any use of the policies system should also use the proxy framework.

## Table of Contents

- [Eco Policy Contract Framework](#eco-policy-contract-framework)
  - [Table of Contents](#table-of-contents)
  - [Security](#security)
  - [Background](#background)
    - [Framework Components](#framework-components)
      - [Policed Contracts](#policed-contracts)
      - [Policy Contracts](#policy-contracts)
      - [The Policy Initialization Process](#the-policy-initialization-process)
    - [Example Upgrade Process](#example-upgrade-process)
    - [Contracts](#contracts)
      - [Policy.sol](#policysol)
      - [Policed.sol](#policedsol)
      - [PolicedUtils.Sol](#policedutilssol)
      - [PolicyInit.sol](#policyinitsol)
  - [Install](#install)
  - [Usage](#usage)
    - [Framework Initialization](#framework-initialization)
  - [Contract Overview](#contract-overview)
    - [Policy](#policy)
      - [Errors](#errors)
      - [Events](#events)
      - [Modifiers](#modifiers)
      - [constructor](#constructor)
      - [Functions](#functions)
    - [Policied](#policied)
      - [Errors](#errors-1)
      - [Events](#events-1)
      - [Modifiers](#modifiers-1)
      - [constructor](#constructor-1)
    - [PolicedUpgradeable](#policedupgradeable)
      - [Functions](#functions-1)
  - [Contributing](#contributing)
  - [License](#license)

## Security

Please note that if the framework isn't initialized properly it may not result in a secure deployment. Read the notes on `PolicyInit` carefully, and consider security when writing both your deployment process and your policy contracts.

## Background

The responsibility of the RootPolicy contract in this system is to manage the community treasury, act as the authorized party to rebind all getter/setters, and to execute transactions fed to it from authorized CommunityGovernance contracts. The Root Policy will remain proxied. Specifically the root policy:

- Executes commands from community governance contracts
- Manages the community treasury
- Is the main designated getter / setter for most of the contracts in the system

![Root Policy](../../docs/assets/root-policy.png "Root Policy")

The main changes in this implementation are:

- Add getter/setter functions for CommunityGovernance
  - Root policy only needs one getter/setter role to define who can call functions for it to execute.
  - For now this will contain a single address, but as governance gets more modular, multiple functions could be whitelisted. Which functions they could call would be enforced at the governance contract level.
- Graceful handling of proposal reverts
  - The root policy contract will need to gracefully handle reverts in the instance that a downstream execution fails.

### Framework Components

#### Policed Contracts

Any contract managed by the Policy Framework should extend the Policed contract (or the PolicedUtils contract, which adds a few minor helper functions).

The core aspect of any policed contract is the `policyCommand` function, which allows policy contracts (permissioned through the Policy Initialization Process described below) to execute arbitrary code in the context of the policed contract. Only authorized policy contracts can call this function, but it provides full flexibility in what can be done within the managed contract. This allows arbitrarily complex policy systems to make any changes they deem necessary in the contracts they oversee.

#### Policy Contracts

Any contract that is part of an oversight process of Policed contracts should extend the Policy contract.

There is a root policy contract for any policed contract, set upon creation, with additional policy contracts fulfilling specialized roles. Any other contracts that are authorized to create policy actions are designated as `setters` in the root policy and must call into that contract to enact changes.

#### The Policy Initialization Process

A special initialization process is used to create new policy contracts. This process is designed to work within the [ERC1820](https://eips.ethereum.org/EIPS/eip-1820) introspection framework to simplify interaction with policy systems. The process sets up interface implementers in the ERC1820 registry which can be used to manage privileges within managed contracts or for discovery to allow contracts to understand where other components are on the network.

### Example Upgrade Process

1. The Eco Currency is deployed in full, including governance.
2. A potential upgrade is identified for one of the proxied currency contracts requiring a code change.
3. The updated code is written and deployed such that it can run in the same storage context as the contract it will be replacing.
4. A proposal contract is written and deployed with a call to `policyCommand` to switch the implementation of the proxy over to the new code.
5. The proposal contract is submitted to Community Governance, to be executed in the context of the proxy for the contract to be upgraded.
6. After successful voting, the Governance Process executes the proposal code in the proxy contracts; switching the proxy to implement the new contract, but retaining the storage context of the old contract.

### Contracts

The framework is made up of four types of contracts: one providing the base functionality for a contract doing management (`Policy.sol`), a parent contract for allowing management of a contract overseen by the framework (`Policed.sol`), one that extends the previous for providing convenient helpers used in many managed contracts at Eco (`PolicedUtils.sol`), and one for bootstrapping the framework within a deployment (`PolicyInit.sol`). All contracts will inherit from `ERC1820Client.sol` which just holds the address and type information on the ERC1820 registry.

#### Policy.sol

Provides the basic functionality expected of a policy contract.

#### Policed.sol

The Policed contract provides the basic operations needed for a contract that should be managed by a policy framework.

#### PolicedUtils.Sol

Provides additional convenience functionality on top of `Policed.sol`.

#### PolicyInit.sol

A one-time-use contract for initial configuration of a policy framework.

## Install

See the [main README](../../README.md) for installation instructions.

## Usage

The framework works best when used in conjunction with proxied contracts to allow for easy upgradability. [ERC1820](https://eips.ethereum.org/EIPS/eip-1820) is a dependency for the system and must exist on your network to use this.

It is possible to pass empty arrays to `fusedInit` when setting up a set of policed contracts. If this is done accidentally you will likely end up with your policies in an unrecoverable state, so it's important to take care when initializing a policy to include all the necessary contracts for initialization.

### Framework Initialization

Begin by deploying the `PolicyInit` contract. Then, deploy your root policy contract and all other contracts you want set with ERC1820 labels. Then deploy a proxy (`ForwardProxy`) pointing at the `PolicyInit` contract. Finally, call `fusedInit` on the proxy, passing the address of your root policy contract as `_policycode`, and any privilege bindings appropriate.

## Contract Overview

For detailed API documentation see [policy](../../docs/solidity/policy/)

### [Policy](../../docs/solidity/policy/Policy.md)

- Inherits [ForwardTarget](../../../docs/solidity/proxy/ForwardTarget.md)

The policy contract that oversees other contracts. Policy contracts provide a mechanism for building pluggable (after deploy) governance systems for other contracts.

#### Errors

##### OnlyGovernor

error for when an address tries submit proposal actions without permission

```solidity
error OnlyGovernor()
```

##### OnlySelf

error for when an address tries to call a pseudo-internal function

```solidity
error OnlySelf()
```

##### FailedProposal

for when a part of enacting a proposal reverts without a readable error

```solidity
error FailedProposal(address proposal)
```

###### Parameters

| Name     | Type    | Description                                            |
| -------- | ------- | ------------------------------------------------------ |
| proposal | address | the proposal address that got reverted during enaction |

#### Events

##### UpdatedGovernor

emits when the governor permissions are changed

```solidity
event UpdatedGovernor(address oldGovernor, address newGovernor)
```

###### Parameters

| Name        | Type    | Description                                                 |
| ----------- | ------- | ----------------------------------------------------------- |
| oldGovernor | address | denotes the old address whose permissions are being removed |
| newGovernor | address | denotes the new address whose permissions are being added   |

##### EnactedGovernanceProposal

emits when enaction happens to keep record of enaction

```solidity
event EnactedGovernanceProposal(address proposal, address governor)
```

###### Parameters

| Name     | Type    | Description                                                                           |
| -------- | ------- | ------------------------------------------------------------------------------------- |
| proposal | address | the proposal address that got successfully enacted                                    |
| governor | address | the contract which was the source of the proposal, source for looking up the calldata |

#### Modifiers

##### onlyGovernorRole

Modifier for checking if the sender is a governor

```solidity
modifier onlyGovernorRole()
```

##### onlySelf

Modifier for faux internal calls
needed for function to be called only during delegate call

```solidity
modifier onlySelf()
```

#### constructor

```solidity
constructor(address _governor) public
```

#### Functions

##### initialize

initializes the governor

```solidity
function initialize(address _self) public virtual
```

##### updateGovernor

pass the governance permissions to another address

```solidity
function updateGovernor(address _newGovernor) public
```

###### Parameters

| Name          | Type    | Description                          |
| ------------- | ------- | ------------------------------------ |
| \_newGovernor | address | the address to make the new governor |

##### enact

```solidity
function enact(address proposal) external virtual
```

##### removeSelf

```solidity
function removeSelf(bytes32) external
```

### [Policied](../../docs/solidity/policy/Policed.md)

- Inherits [Policy](../../../docs/solidity/policy/Policy.md)

A policed contract is any contract managed by a policy.

#### Errors

##### NonZeroPolicyAddr

If the policy address is set to zero, the contract is unrecoverably ungovernable

```solidity
error NonZeroPolicyAddr()
```

##### NonZeroContractAddr

If this address is set to zero the contract is an unusable state

```solidity
error NonZeroContractAddr(string contractName)
```

###### Parameters

| Name         | Type   | Description                                                 |
| ------------ | ------ | ----------------------------------------------------------- |
| contractName | string | the name of the contract that was given as the zero address |

##### PolicyOnlyFunction

For if a non-policy address tries to access policy role gated functionality

```solidity
error PolicyOnlyFunction()
```

#### Events

##### NewPolicy

emits when the policy contract is changed

```solidity
event NewPolicy(contract Policy newPolicy, contract Policy oldPolicy)
```

###### Parameters

| Name      | Type            | Description                             |
| --------- | --------------- | --------------------------------------- |
| newPolicy | contract Policy | denotes the new policy contract address |
| oldPolicy | contract Policy | denotes the old policy contract address |

#### Modifiers

##### onlyPolicy

Restrict method access to the root policy instance only.

```solidity
modifier onlyPolicy()
```

#### constructor

constructor

```solidity
constructor(contract Policy _policy) internal
```

##### Parameters

| Name     | Type            | Description                               |
| -------- | --------------- | ----------------------------------------- |
| \_policy | contract Policy | the address of the owning policy contract |

### [PolicedUpgradeable](../../docs/solidity/policy/PolicedUpgradeable.md)

- Inherits [Policied](../../docs/solidity/policy/Policied)

A PolicedUpgradeable contract is any proxied contract managed by a policy.

#### Functions

##### setImplementation

```solidity
function setImplementation(address _impl) public
```

## Contributing

See the [main README](../../README.md).

## License

See the [main README](../../README.md).
