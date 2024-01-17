# The Eco Currency

> Contracts implementing the Eco currency.

This implements the ECO cryptocurrency, and its secondary token ECOx, in the form of smart contracts on the Ethereum VM.

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Contract Overivew](#contract-overview)
- [Contributing](#contributing)
- [License](#license)

## Security

The Eco currency implementation is designed to be managed by the [Governance System](../governance). Other deployments have not been considered.

## Background

The ECO and ECOx ERC20 tokens are managed by the `ECO.sol` and `ECOx.sol` contracts respectively, inhereting that functionality from a slightly modified copy of `ERC20.sol` in this repository. ECO has significant extra functionality added on top of this standard that is tied to Eco's governance system. ECOx is closer to a base ERC20 and should be easily compliant in external systems.

The first main function of ECO is a vote snapshotting system that operates off of transfer hooks. The hooks are used to snapshot voting for use in Eco's governance system (see the `VotingPower` contract [here](../governance/community/README.md#votingpower)). In return, the voting contracts are authorized to create new snapshot for voting purposes. This functionality maintains a current snapshot of the user's voting power (as well as total supply) at the most recent snapshot.

The ECO token supports linear inflation (increasing or decreasing all balances by a multiplier) and the effects of this operation is detailed in the `InflationSnapshots` contract, a parent of `ECO`. The balances are stored in "uninflated" units that are not affected by inflation actions. The balances are then returned as the uninflated balance divided by the inflation factor. The inflation multiplier is stored in its own set of checkpoints to facilitate snapshot balance lookups. This is similar to rebase functions of other currencies, except it is infrequent, and triggered by the decisions of governance (see [Monetary Governance](../governance/monetary/README.md) for more information).

ECO voting power must be opted into and can be delegated. By not opting in, an address's balance of votes is not tracked in a snapshot, lowering transaction cost. Delegation allows the owner's balance to be tracked in the snapshots for the delegate. Note, this doesn't change the balance of the address, only its voting power. Delegate functionality is detailed in the `ERC20Delegated` contract, which is a parent of `VoteSnapshots` and therefore `ECO`. Each address is, by default, not opted into voting and undelegated.

The ECOx token allows the functionality to convert ECOx into ECO. The amount of ECO received is based on the percentage of total supply of the ECOx burned (see `ECOxExchange.sol` below for more details). ECOx does not have inflation in its design and its voting is handled by an external [staking contract](../governance/community/README.md#ecoxstaking) instead of by checkpoints.

Finally, both tokens can be "paused" by an elected address, governed by Eco's governance system. During a pause, all transfers are rejected.

### References

- [ERC20](https://theethereum.wiki/w/index.php/ERC20_Token_Standard)
- [ERC2612](https://eips.ethereum.org/EIPS/eip-2612)
- [ERC712](https://eips.ethereum.org/EIPS/eip-712)
- [ERC1820](https://eips.ethereum.org/EIPS/eip-1820)

## Install

See the [main README](../../README.md) for installation instructions.

## Usage

The currency contracts are intended for deployment on the Ethereum blockchain, using Eco's [Governance System](../governance).

## Contract Overview

For detailed API documentation see [currency](../../docs/solidity/currency/)

### [ERC20](../../docs/solidity/currency/ERC20.md)

- Inherits: [ERC20Permit](../../docs/solidity/currency/ERC20Permit.md)

Other than the `permit` functionality that follows the [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) standard, Eco's implementation of ERC20 differs from the baseline in a few ways. One is that transfers to the zero address are disallowed; the `burn` function must be used instead. The `approve` function disallows approvals to the zero address to make it clear that this is the case. Another difference is that `transferFrom` emits an `Approval` event to denote the fact that the approval amount is changed by its action. Towards clarity and for safety in other use, functions for `decreaseAllowance` and `increaseAllowance` are added. When it comes to return values, functions will revert instead of returning `false`, but will still return `true` on success to remain compatible for integrations that check for success. Finally, the `name` and `symbol` variables are stored as immutable bytes32 and converted to strings by the getter functions.

### [ERC20Pausable](../../docs/solidity/currency/ERC20Pausable.md)

- Inherits: [ERC20](../../docs/solidity/currency/ERC20.md), `Pausable`

Using the openzeppelin library for tracking the pause, this contract sets up a `pauser` and a `roleAdmin` to be in charge of the circuit breaker. The `pauser` is the address that is able to pause the system (stopping transfers) and the `roleAdmin` is the address which can change the `pauser`. In Eco's system, the root policy contract is the `roleAdmin` as this allows the `pauser` to be changed by [Community Governance](../governance/community/README.md).

### [DelegatePermit](../../docs/solidity/currency/DelegatePermit.md)

- Inherits: `EIP712`

Implements a standard usage of EIP712 (read more [here](https://eips.ethereum.org/EIPS/eip-712)) for the `delegate` function. The typehash `keccak256("Delegate(address delegator,address delegatee,uint256 nonce,uint256 deadline)")` is used and the openzeppelin utility for `Counters` is used for the nonces. Other than allow the checking of nonces for addresses, all functionality of this contract is internal.

### [ERC20MintAndBurn](../../docs/solidity/currency/ERC20MintAndBurn.md)

- Inherits: [PolicedUpgradeable](../../docs/solidity/policy/PolicedUpgradeable.md), [ERC20Pausable](../../docs/solidity/currency/ERC20Pausable.md)

This contract exposes permissioned mint and burn functions as well as a system for allowing the privileged policy contract to change permissioning. The expected default behavior of no addresses being able to mint and addresses being able to burn only their own tokens is maintained.

### [TotalSupplySnapshots](../../docs/solidity/currency/TotalSupplySnapshots.md)

- Inherits: [ERC20MintAndBurn](../../docs/solidity/currency/ERC20MintAndBurn.md)

This contract defines the snapshot storage structure as well as the internal functionality of creating a snapshot. It computes and maintains a snapshot the total supply which updates on mint or burn after a new snapshot is taken.

### [ERC20Delegated](../../docs/solidity/currency/ERC20Delegated.md)

- Inherits: [DelegatePermit](../../docs/solidity/currency/DelegatePermit.md), [TotalSupplySnapshots](../../docs/solidity/currency/TotalSupplySnapshots.md)

This contract tracks delegations of an ERC20 token by tokenizing the delegations. It tracks an internal companion token that is transferred along to denote changes in votes brought on by both transfers (via \_afterTokenTransfer hooks) and delegations.

Delegation of the secondary token creates allowances for the delegate to allow the delegator to reclaiming the voting power later if they so desire.

Voting power can be queried through the public accessor {voteBalanceOf}. Vote power can be delegated either by calling the {delegate} function directly, using {delegateAmount} to delegate a portion of votes, or by providing a signature to be used with {delegateBySig}.

Delegates need to disable their own ability to delegate to enable others to delegate to them. Delegations can be done in partial amounts via {delegateAmount}. This is intended for contracts which can run their own internal ledger of delegations and delegating in this manner will prevent you from transferring the delegated funds until you undelegate.

### [VoteSnapshots](../../docs/solidity/currency/VoteSnapshots.md)

- Inherits: [ERC20Delegated](../../docs/solidity/currency/ERC20Delegated.md)

The `VoteSnapshots` extension maintains a snapshot of each addresses's votes which updates on the transfer after a new snapshot is taken. Only addresses that have opted into voting are snapshotted.

### [InflationSnapshots](../../docs/solidity/currency/InflationSnapshots.md)

- Inherits: [VoteSnapshots](../../docs/solidity/currency/VoteSnapshots.md)

This contract implements a scaling inflation multiplier on all balances and votes. Changing this value is done via implementing \_rebase. The inflation multiplier comes with its own snapshot to prevent snapshots from changing if the inflation multiplier has been changed since the last snapshot.

### [ECO](../../docs/solidity/currency/ECO.md)

- Inherits: [InflationSnapshots](../../docs/solidity/currency/InflationSnapshots.md)

The `ECO` contract manages the function of the primary token, ECO. Its constructor sets the `name` and `symbol` values for `ERC20` both to "ECO". On creation it mints an initial supply to a distributor contract, both set in the constructor. See [TokenInit](./README.md#tokeninit) for more details on initial distribution patterns. The rest of the functionality is permissioning around `snapshot` and `rebase` functionality.

### [ECOx](../../docs/solidity/currency/ECOx.md)

- Inherits: [TotalSupplySnapshots](../../docs/solidity/currency/TotalSupplySnapshots.md)

The `ECOx` contract inherits `TotalSupplySnapshots` which has as a baseline `ERC20MintAndBurn`. It defines the permissioning around snapshotting, even though the snapshots only apply to the total supply. Finally, much like ECO, the ECOx contract mints its initial supply to a distributor on construction, see [TokenInit](./README.md#tokeninit) for more details.

### [ECOxExchange](../../docs/solidity/currency/ECOxExchange.md)

- Inherits: [ECO](../../docs/solidity/currency/ECO.md), [Policied](../../docs/solidity/policy/Policed.md), [ECOx](../../docs/solidity/currency/ECOx.md)

Controls the ability to exchange ECOx for ECO tokens in a percentage way. Usage of this function does not assume an allowance, instead this contract is authorized to burn users' ECOx and mint ECO.

### [TokenInit](../../docs/solidity/currency/TokenInit.md)

Inherits: `Ownable`

Used to distribute the initially minted supply, both ECO and ECOx use their own `TokenInit` contract. The token mints the initial supply in its constructor (and initialize function for when it's proxied) with this contract as the recipient. Then `distributeTokens` performs the distribution. This process is permissioned to the deployer.

### [VoteCheckpoints](../../docs/solidity/currency/VoteCheckpoints.md)

- Inherits: [ERC20Pausable](../../docs/solidity/currency/ERC20Pausable.md), [DelegatePermit](../../docs/solidity/currency/DelegatePermit.md)

The `VoteCheckpoints` contract adds the tracking for voting in the Eco governance system. Here, the system of delegating voting power and checkpointing balances for that voting power is implemented. This contract is not used for either ECO or ECOx contract, but is instead used for the [ECOxStaking](../governance/community/README.md#ecoxstaking) contract's staking token.

## Contributing

See the [main README](../../README.md).

## License

See the [main README](../../README.md). Note that some files in this directory are under different licenses. See file headers for details where applicable.
