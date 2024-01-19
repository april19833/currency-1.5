# Eco Currency and Governance _(currency 1.5)_

> The Eco cryptocurrency contracts, governance contracts, and associated
> tooling.

The Eco cryptocurrency and governance system are implemented here, along with all the custom tools, frameworks, and tests used primarily for the currency system.

The project is organized into components:

- [The token implementation](contracts/currency)
- [The policies framework](contracts/policy)
- [The governance system](contracts/governance)
  - [Community governance](contracts/governance/community)
  - [Monetary governance](contracts/governance/monetary)
- [Testing Framework](test)
- [The deployment tooling](contracts/deploy)

Each component is documented in a README file in the corresponding contracts directory. See the [Background](#background) section for an overview of how they fit together.

## Table of Contents

- [Eco Currency and Governance _(currency 1.5)_](#eco-currency-and-governance-currency-15)
  - [Table of Contents](#table-of-contents)
  - [Security](#security)
    - [Note on Solidity Optimizations](#note-on-solidity-optimizations)
    - [Reporting Vulnerabilities](#reporting-vulnerabilities)
  - [Background](#background)
  - [Currency 1.5 Enhancements](#currency-15-enhancements)
    - [The ECOsystem](#the-ecosystem)
      - [Tokens /currency](#tokens-currency)
      - [The Governance System /governance](#the-governance-system-governance)
    - [Infrastructure](#infrastructure)
      - [The Policies Framework /policy](#the-policies-framework-policy)
      - [The Proxy Framework /proxy](#the-proxy-framework-proxy)
      - [The Deployment Tooling /deploy](#the-deployment-tooling-deploy)
  - [Install](#install)
  - [Usage](#usage)
    - [Compiling the contracts](#compiling-the-contracts)
    - [Running the Linter, Tests and Coverage Report](#running-the-linter-tests-and-coverage-report)
      - [Linting + prettier](#linting--prettier)
      - [Testing](#testing)
      - [Coverage Reporting](#coverage-reporting)
      - [Generating Documentation](#generating-documentation)
    - [Running a deployment](#running-a-deployment)
  - [Components](#components)
  - [Contributing](#contributing)
  - [License](#license)

## Security

### Note on Solidity Optimizations

This repository has default compiler optimizations turned on! This can, in some cases, result in unexpected behavior. The test suites are designed to be run with optimizations configured as they are for deployment and will not detect changes in behavior caused by the optimizer.

If you believe the optimizer may be changing the behavior of your code please test with the optimizer disabled to verify and discuss with the team.

### Reporting Vulnerabilities

If you believe you've identified a security vulnerability in the Eco Currency contracts or other software, please submit to the Immunefi bounty (link coming soon) or join the [Eco Association Discord](https://discord.eco.org) and tag or message an Eco Association team member.

## Background

The Eco currency is intended to serve as a decentralized, free-floating alternative to fiat currencies - a currency used for saving and spending. To achieve this goal, Eco uses a governance process which has in-built monetary policy levers (described below) controlled by a group of elected individuals, as well as an overall community governance process for upgrades to the protocol.

## Currency 1.5 Enhancements

Currency 1.5 was inspired by the desire to simplify and modularize the Eco Protocol governance system. The initial implementation of the Eco Protocol is complicated, difficult to upgrade, contains many interdependent components, and an ERC1820 registry system. The goal of this redesign is to accomplish the following:

- Simplify the architecture of the Eco Protocol to invite new contributors
- Maintain full backward compatibility
- Maintain flexibility for upgrades
- Significantly decrease the cognitive overhead for upgrades
- Decrease dynamism and moving parts
- Minimize system interdependency
- Reduce gas costs with only minor changes
- Increase testability of the design so that contracts can be tested as modules
- Ensure that downstream contracts are core dependencies of all other contracts, and not dependent on any other contracts.

### The ECOsystem

The user-facing logic comprises of the `currency` and the `governance`, of which the latter can be further subdivided into `monetary governance` (managed by trustees) and `community governance` (managed by all stakeholders):

#### Tokens [/currency](./contracts/currency/README.md)

##### The Base Currency

ECO is a variable supply base currency. The token (ECO) implementation provides the code driving the ERC20 token. It takes responsibility for storing balances for all account holders, transferring funds between accounts, creating and destroying tokens, and providing the interfaces that token holders will typically interact with.

##### The Secondary Token

The secondary token (ECOx) is a deflationary supply asset intended to incentivize long-term holders and bootstrap governance and an open market signaling expectations for ECO adoption. It is also an ERC20 token. Its initial main functionality, aside from governance, is being convertible to an amount of ECO proportionally based on percentage of the total supply of each token.

#### The Governance System [/governance](./contracts/governance/README.md)

The Governance module contains the monetary and community governance submodules, as well as the general governance logic for pushing the ECOsystem into a new generation. Monetary and community governance operate on a timescale defined by this logic.

##### Monetary Governance [/governance/monetary](./contracts/governance/monetary)

The monetary governance submodule allows community-elected trustees to make decisions about the monetary supply in the economy. It initially involves 3 possible actions: minting tokens and distributing them at random (Random Inflation), minting tokens and using them as rewards for lockup contracts (Lockups), and re-scaling each account balance equally (Linear Inflation).

##### Community Governance [/governance/community](./contracts/governance/community/README.md)

The community governance submodule allows anyone with tokens (ECO or ECOx) to propose arbitrary changes to contracts and then participate in a vote on those changes, all facilitated to by the policy framework. This allows for the ECOsystem to adapt to changing economic circumstances and evolve to meet users' needs and giving users direct influence over the economy in which they all participate.

### Infrastructure

Outside of these core modules there are a few major infrastructure components that underlie the system, but whose use is primarily abstracted away from the user:

#### The Policies Framework [/policy](./contracts/policy)

The policies framework provides the core contract logic that facilitates upgradability, and is used to enforce access control and permissions between contracts. This framework also uses the clone component (/clone) to efficiently deploy clones of core contracts on generation increase.

#### The Proxy Framework [/proxy](./contracts/proxy)

The proxy framework, combined with the ERC1820 registry, allow contracts to be upgraded while keeping their state intact and maintaining accessibility without the need to publicize a new address.

#### The Deployment Tooling [/deploy](./deploy)

TODO - write this section when creating deployments including upgrade process.

## Install

To use the code you'll need the proper tools. Make sure you have a recent version of [Node.JS](https://nodejs.org), a recent version of [NPM](https://npmjs.com), and [YARN](https://classic.yarnpkg.com/lang/en/).

Once Node, NPM and YARN are installed you can set your node version using

```bash
nvm use
```

then use the `yarn` command to install additional dependencies:

```bash
yarn install
```

## Usage

These contracts are intended for deployment to the Ethereum blockchain. Once deployed, you can interact with the contracts using the standard Ethereum RPC mechanisms. The key contract functions are documented in the API sections of the component README files.

### Compiling the contracts

To compile the contracts run

```bash
yarn build
```

### Running the Linter, Tests and Coverage Report

The commands below provide the basics to get set up developing as well as outlining conventions and standards - all code should pass the linter and prettier, all tests should pass, and code coverage should not decrease.

#### Linting + prettier

`eslint` and `solhint` are used to lint the code in this repository. Additionally, the prettier enforces a clean code style for readability. You can run the linter and prettier using:

```bash
yarn lint
```

and

```bash
yarn format
```

`yarn lint` displays all the linting and formatting issues wheres `yarn format` resolves them by updating the files.

#### Testing

You can run the test suite by invoking:

```bash
yarn test
```

The test suite is extensive and can take some time to run.

#### Coverage Reporting

Coverage reports are generated separated for Solidity and JavaScript code:

```bash
yarn coverage
```

To get an interactive report on [http://localhost:7800](http://localhost:7800) you can install [python](https://www.python.org/downloads/) and run the following command:

```bash
yarn coverageReport
```

#### Generating Documentation

Additional document can be generated and is placed in the `docs` folder. Some of these require the installation of [slither](https://github.com/crytic/slither).

The repository holds contracts from 1.0 used for migration purposes. To simplify the documents generated we first remove migration related code, then generate the docs, then reinstate the code this is done as follows

```bash
# Comment out MigrationLinker.propo.sol
mv ./contracts/test/deploy/MigrationLinker.propo.sol ./contracts/test/deploy/MigrationLinker.propo.sol.tmp

# Remove the currency 1.0 contracts
rm -rf ./node_modules/@helix-foundation

# generate the docs
yarn updateDocs

# reinstate MigrationLinker.propo.sol
mv ./contracts/test/deploy/MigrationLinker.propo.sol.tmp ./contracts/test/deploy/MigrationLinker.propo.sol

# reinstate the currency 1.0 contracts
yarn install --force


```

Following are some individual commands

- `yarn docgen`: Generate documentation from [solidity natspec comments](https://docs.soliditylang.org/en/latest/natspec-format.html) into [./docs/solidity](./docs/solidity)
- `yarn callGraph`: Generates a contract call graph into [./docs/slither/call-graph.png](./docs/slither/call-graph.png)
- `yarn inheritanceGraph`: Generates a contract inheritance graph into [./docs/slither/inheritance-graph.png](./docs/slither/inheritance-graph.png)
- `yarn variableOrder`: Creates a list of slot usage and offsets, useful to ensure upgradeable contracts use valid memory slots into [./docs/slither/variable-order.txt](./docs/slither/variable-order.txt)
- `yarn contractSummary`: Creates a summary of all contracts into [./docs/slither/contract-summary.txt](./docs/slither/contract-summary.txt)
- `yarn vulnerability`: Generates a slither analysis of high solidity vulnerabilities [./docs/slither/vulnerability.txt](./docs/slither/vulnerability.txt)

### Running a deployment

TODO - Need to write this section including migration.

## Components

- [Currency Implementation](./contracts/currency)
- [Governance](./contracts/governance)
  - [Community governance](./contracts/governance/community)
  - [Monetary governance](./contracts/governance/monetary)
- [Policy Framework](./contracts/policy)
- [Proxy Framework](./contracts/proxy)
- [Deployment Tools](./contracts/deploy)
- [The Verifiable Delay Function](./contracts/VDF)

## Contributing

Contributions are welcome. Please submit any issues as issues on GitHub, and open a pull request with any contributions.

Please ensure that the test suite passes (run `yarn test`) and that the linters run at least as cleanly as they did when you started (run `yarn lint`). Pull requests that do not pass the test suite or that produce significant lint errors will likely not be accepted.

See the [contributing guide](./CONTRIBUTING.md) for more details.

## License

[MIT (c) Eco Association](./LICENSE)
