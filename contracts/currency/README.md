# The Eco Currency

> Contracts implementing the Eco currency.

This implements the ECO cryptocurrency, and its secondary token ECOx, in the form of smart contracts on the Ethereum VM.

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Security

The Eco currency implementation is designed to be managed by the [Governance System](../governance). Other deployments have not been considered.

## Background

The ECO and ECOx ERC20 tokens are managed by the `ECO` and `ECOx` contracts respectively, inhereting that functionality from a slightly modified copy of `ERC20.sol` in this repository. ECO has significant extra functionality added on top of this standard that is tied to Eco's governance system. ECOx is closer to a base ERC20 and should be easily compliant in external systems.

The first main function of ECO is a vote checkpointing system that operates off of post-transfer hooks. The checkpoint system is used to snapshot voting in Eco's governance system (see the `VotingPower` contract [here](../governance/community/README.md#votingpower)). This allows for methods to lookup up the user's balance at the time (block number) when the vote in question starts and "snapshots" voting power.

The ECO token supports linear inflation (increasing or decreasing all balances by a multiplier) and the effects of this operation is detailed in the `InflationSnapshots` contract, a parent of `ECO`. The balances are stored in "uninflated" units that are not affected by inflation actions. The balances are then returned as the uninflated balance divided by the inflation factor. The inflation multiplier is stored in its own set of checkpoints to facilitate historical balance lookups. This is similar to rebase functions of other currencies, except it is infrequent, and triggered by the decisions of governance (see [Monetary Governance](../governance/monetary/README.md) for more information).

ECO can also be delegated. This allows the owner's balance to be tracked in the checkpoints for the delegates. Note, this doesn't change the balance of the user, only its voting power. Delegate functionality is detailed in the `VoteCheckpoints` contract, which is a parent of `InflationCheckpoints` and therefore `ECO`. Each address is, by default, not delegated.

The ECOx token adds the functionality to convert ECOx into ECO. The amount of ECO received is based on the percentage of total supply of the ECOx burned (explained in detail in the API). ECOx does not have inflation in its design and its voting is handled by a [staking contract](../governance/community/README.md#ecoxstaking) instead of by checkpoints.

Finally, both tokens can be "paused" by an elected address, governed by Eco's governance system. During a pause, all transfers are rejected.

### References

- [ERC20](https://theethereum.wiki/w/index.php/ERC20_Token_Standard)
- [ERC2612](https://eips.ethereum.org/EIPS/eip-2612)
- [ERC712](https://eips.ethereum.org/EIPS/eip-712)
- [ERC1820](https://eips.ethereum.org/EIPS/eip-1820)

## Install

See the [main README](../../README.md) for installation instructions.

## Usage

The currency contracts are intended for deployment on the Ethereum blockchain, using Eco's [Governance System](../governance) (built on the [policy framework](../policy)). Each currency contract is built to handle the balances and peer to peer actions of token holding addresses.

## API

For detailed API documentation see [currency](../../docs/solidity/currency/)

### [ERC20](../../docs/solidity/currency/ERC20.md)

- Inherits: [ERC20Permit](../../docs/solidity/currency/ERC20Permit.md)

Other than the `permit` functionality that will be detailed in its associated contract, Eco's implementation of ERC20 differs from the baseline in a few ways. One is that transfers to the zero address are disallowed and the `burn` function must be used instead. The `approve` function disallows approvals to the zero address to make it clear that this is the case. Another difference is that `transferFrom` emits an `Approval` event to denote the fact that the approval amount is changed by its action. Towards clarity and for safety in other use, functions for `decreaseAllowance` and `increaseAllowance` are added. When it comes to return values, functions will revert instead of returning `false`, but will still return `true` on success to remain compatible for integrations that check for success. Finally, the `name` and `symbol` variables are stored as immutable bytes32 and converted to strings by the getter functions.

### [ERC20Pausable](../../docs/solidity/currency/ERC20Pausable.md)

- Inherits: `ERC20`, `Pausable`

Using the openzeppelin library for tracking the pause, this contract sets up a `pauser` and a `roleAdmin` to be in charge of the circuit breaker. The `pauser` is the address that is able to pause the system (stopping transfers) and the `roleAdmin` is the address which can change the `pauser`. In Eco's system, the root policy contract is the `roleAdmin` as this allows the `pauser` to be changed by [Community Governance](../governance/community/README.md).

### [DelegatePermit](../../docs/solidity/currency/DelegatePermit.md)

- Inherits: `EIP712`

Implements a standard usage of EIP721 (read more [here](https://eips.ethereum.org/EIPS/eip-712)) for the `delegate` function. The typehash `keccak256("Delegate(address delegator,address delegatee,uint256 nonce,uint256 deadline)")` is used and the openzeppelin utility for `Counters` is used for the nonces. Other than allow the checking of nonces for addresses, all functionality of this contract is internal.

### [VoteCheckpoints](../../docs/solidity/currency/VoteCheckpoints.md)

- Inherits: `ERC20Pausable`, `DelegatePermit`

The `VoteCheckpoints` contract adds the tracking for voting in the Eco governance system. Here, the system of delegating voting power and checkpointing balances for that voting power is implemented. This contract sits before the linear inflation layer ([InflationCheckpoints](./README.md#inflationcheckpoints)), so all the values it stores, emits, and takes as inputs are in the base (unchanging) values stored in the ERC20 layer. This will require contracts interfacing with this layer to use the inflation multiplyer.

### [ERC20MintAndBurn](../../docs/solidity/currency/ERC20MintAndBurn.md)

- Inherits: `PolicedUpgradeable`, `ERC20Pausable`

An ERC20 token interface for ECOx

### [TotalSupplySnapshots](../../docs/solidity/currency/TotalSupplySnapshots.md)

- Inherits: `ERC20MintAndBurn`

This extension maintains a snapshot the total supply which updates on mint or burn after a new snapshot is taken.

### [ERC20Delegated](../../docs/solidity/currency/ERC20Delegated.md)

- Inherits: `ERC20Pausable`, `DelegatePermit`, `TotalSupplySnapshots`

This contract tracks delegations of an ERC20 token by tokenizing the delegations. It assumes a companion token that is transferred to denote changes in votes brought on by both transfers (via \_afterTokenTransfer hooks) and delegations.

The secondary token creates allowances whenever it delegates to allow for reclaiming the voting power later

Voting power can be queried through the public accessor {voteBalanceOf}. Vote power can be delegated either by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}.

Delegates need to disable their own ability to delegate to enable others to delegate to them. Raw delegations can be done in partial amounts via {delegateAmount}. This is intended for contracts which can run their own internal ledger of delegations and will prevent you from transferring the delegated funds until you undelegate.

### [VoteSnapshots](../../docs/solidity/currency/VoteSnapshots.md)

- Inherits: `ERC20Delegated`

The `VoteSnapshots` extension maintains a snapshot of each addresses's votes which updates on the transfer after a new snapshot is taken. Only addresses that have opted into voting are snapshotted.

### [InflationSnapshots](../../docs/solidity/currency/InflationSnapshots.md)

- Inherits: `VoteSnapshots`

This contract implements a scaling inflation multiplier on all balances and votes. Changing this value (via implementing \_rebase)

### [ECO](../../docs/solidity/currency/ECO.md)

- Inherits: `InflationSnapshots`, `CurrencyGovernance`

The `ECO` contract manages the function of the primary token, ECO. Its constructor sets the `name` and `symbol` values for `ERC20` both to "ECO". On creation it mints an initial supply to a distributor contract, both set in the constructor. See [TokenInit](./README.md#tokeninit) for more details on the distribution. The rest of the functionality is permissioning `mint` and `burn` as well as recieving the inflation multiplier each generation.

### [ECOx](../../docs/solidity/currency/ECOx.md)

- Inherits: `IECO`, `TotalSupplySnapshots`

The `ECOx` contract inherits `TotalSupplySnapshots` which has as a baseline `ERC20Pausable` without minting or burning (outside of proposals). Finally, much like ECO, the ECOx contract mints its initial supply to a distributor on construction, see [TokenInit](./README.md#tokeninit) for more details.

### [ECOxExchange](../../docs/solidity/currency/ECOxExchange.md)

- Inherits: `ECO`, `Policied`, `ECOx`

Provides the ability to exchange ECOx for ECO tokens in a percentage way. The ECOx token exists for this function alone so as to provide a market for the future of the ECO token.

## Contributing

See the [main README](../../README.md).

## License

See the [main README](../../README.md). Note that some files in this directory are under different licenses. See file headers for details where applicable.

### [TokenInit](../../docs/solidity/currency/TokenInit.md)

Inherits: `Ownable`

Used to distribute the initial supply, both ECO and ECOx use a `TokenInit` contract. The token mints the initial supply in its constructor (and initialize function for when it's proxied) to this contract. Then `distributeTokens` performs the distribution. As all parts of this process are part of the deploy, usage is permissioned to the deployer.

#### distributeTokens

Arguments:

- `_token` (address) - the address of the ERC20 token to distribute for.
- `_initialHolders` (address[]) - an array of addresses of the initial holders.
- `_initialBalances` (uint256[]) - an array of balances to transfer to each in `_initialHolders`

This function expects both arrays to have the same length and for the address to be a token contract for which this contract already holds tokens. It transfers the first amount in `_initialBalances` to the first address in `_initialHolders`, second to second, and so on and so forth. It assumes that `_initialBalances` sums to an amount less than or equal to the balance of this contract and makes no check to assure that there are no duplicates in `_initialHolders`. Only the deployer of this contract can call this function.
