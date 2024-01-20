# Eco Policy Governance

> The Eco Policy Framework

The contracts in this directory provide the central authority for Eco governance actions. The main Policy allows the management of some abstract set of contracts by an arbitrary oversight process. The Policy can execute arbitrary code triggered through the [Community Governance](../governance/community/README.md) process. This allows for admin like privileges on contracts to be gated by community acceptance through governance.

## Table of Contents

- [Eco Policy Governance](#eco-policy-governance)
  - [Table of Contents](#table-of-contents)
  - [Security](#security)
  - [Background](#background)
    - [Framework Components](#framework-components)
      - [Policed Contracts](#policed-contracts)
      - [Policy Contracts](#policy-contracts)
    - [Example Replacement Upgrade Process](#example-replacement-upgrade-process)
    - [Proxy Upgrade Process](#proxy-upgrade-process)
  - [Install](#install)
  - [Usage](#usage)
  - [Contract Overview](#contract-overview)
    - [Policy](#policy)
    - [Policed](#policed)
    - [PolicedUpgradeable](#policedupgradeable)
  - [Contributing](#contributing)
  - [License](#license)

## Security

Please note that the Policy contract completely relies on the result of Community Governance to use its admin privileges. Failure of that governance process could render changes impossible.

## Background

The responsibility of the main Policy contract in this system is to manage the community treasury, act as the authorized party to rebind all getter/setters, and to execute transactions fed to it from authorized CommunityGovernance contracts. The main Policy will remain proxied so as to not require rebinding of this admin address if its functionality is to be upgraded.

### Framework Components

#### Policed Contracts

Any contract managed by the Policy should extend the Policed contract (or the PolicedUpgradeable contract if it is to be upgradeable).

The core aspect of any policed contract is the `policy` variable which is immutably set on their deployment. This variable is used for every single role management function in child contracts. Governance assumes that a call from the main Policy contract will be authorized to create the change desired, or at least authorized to give the Policy the authority to do so. See [ERC20MintAndBurn](../currency/README.md#erc20mintandburn) for a simple example of this process. The Policy might not have minting permissions, but it has the permission to give itself minting permissions and then mint if needed. This pattern is followed by all contracts that inherit from `Policed.sol`.

#### Policy Contracts

Any contract that is part of an oversight process of Policed contracts should extend the Policy contract. In practice, this is the main Policy contact and any Proposal going through governance that looks to be enacted by the main Policy contract.

### Example Replacement Upgrade Process

1. The Eco Currency is assumed to be deployed in full, including governance.
2. A potential upgrade is identified for one of the permissioned contracts requiring a code change.
3. The updated code is written and deployed with any relevant long-lived data inputted on construction to match the old contract.
4. A proposal contract is written and deployed with a call to the role updating functions to remove all permissions from the previous version of the contract and give them to the new version.
5. The proposal contract is submitted to Community Governance, to be executed in the context of the main Policy contract which holds the role changing permissions.
6. After successful voting, the Governance Process executes the proposal code; switching the permissions to the new contract.

### Proxy Upgrade Process

The proxy upgrade process follows the exact same process as a replacement upgrade, except the new contract must be writted to function in the storage context of the old one, and [PolicedUpgradeable](#policedupgradeable) is used to change the implementation. Permissions to not need to be rebound as the proxy storage and address are unchanging.

## Install

See the [main README](../../README.md) for installation instructions.

## Usage

The main Policy contract only needs to be linked to the Community Governance contract when deployed. The rest of its usage is through the Community Governance process. Policed contract only need a Policy address on deployment and then their inherited permissioned functionality uses this address.

## Contract Overview

For detailed API documentation see [policy](../../docs/solidity/policy/)

### [Policy](../../docs/solidity/policy/Policy.md)

- Inherits [ForwardTarget](../../../docs/solidity/proxy/ForwardTarget.md)

The policy contract that oversees other contracts. It has a role for another governing contract which holds the burden of security to its admin privileges, and a function, only callable by that contract, which enacts a delegated call function from an arbitrary address. It can upgrade itself through a self gated function, callable by a delegate call in a governance proposal.

### [Policed](../../docs/solidity/policy/Policed.md)

A policed contract is any contract managed by a policy. It has nothing other than the utility code for creating a permissioned role.

### [PolicedUpgradeable](../../docs/solidity/policy/PolicedUpgradeable.md)

- Inherits [Policed](../../docs/solidity/policy/Policed), `ForwardTarget`

A PolicedUpgradeable contract is any proxied contract managed by a policy. It implements the `policy` role to allow it to change the implementation of the proxy.

## Contributing

See the [main README](../../README.md).

## License

See the [main README](../../README.md).
