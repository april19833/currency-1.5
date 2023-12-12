# Eco Association

Copyright (c) 2023 Eco Association

## MinterProposal

### token

```solidity
contract ERC20MintAndBurn token
```

### minter

```solidity
address minter
```

### permission

```solidity
bool permission
```

### constructor

```solidity
constructor(contract ERC20MintAndBurn _token, address _minter, bool _permission) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## BurnerProposal

### token

```solidity
contract ERC20MintAndBurn token
```

### burner

```solidity
address burner
```

### permission

```solidity
bool permission
```

### constructor

```solidity
constructor(contract ERC20MintAndBurn _token, address _burner, bool _permission) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## RebaserProposal

### token

```solidity
contract ECO token
```

### rebaser

```solidity
address rebaser
```

### permission

```solidity
bool permission
```

### constructor

```solidity
constructor(contract ECO _token, address _rebaser, bool _permission) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## SnapshotterProposal

### token

```solidity
contract ECO token
```

### snapshotter

```solidity
address snapshotter
```

### permission

```solidity
bool permission
```

### constructor

```solidity
constructor(contract ECO _token, address _snapshotter, bool _permission) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## UpdateECOxExchangeProposal

### token

```solidity
contract ECOx token
```

### newECOxExchange

```solidity
address newECOxExchange
```

### constructor

```solidity
constructor(contract ECOx _token, address _newECOxExchange) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## UpdateTokenPauserProposal

### token

```solidity
contract ERC20Pausable token
```

### newPauser

```solidity
address newPauser
```

### constructor

```solidity
constructor(contract ERC20Pausable _token, address _newPauser) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## UpdateGovernancePauserProposal

### governance

```solidity
contract CommunityGovernance governance
```

### newPauser

```solidity
address newPauser
```

### constructor

```solidity
constructor(contract CommunityGovernance _governance, address _newPauser) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## SweepGovernanceFeesProposal

### governance

```solidity
contract CommunityGovernance governance
```

### destination

```solidity
address destination
```

### constructor

```solidity
constructor(contract CommunityGovernance _governance, address _destination) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## UpdateGovernanceTrustedNodesProposal

### governance

```solidity
contract CurrencyGovernance governance
```

### newTrustedNodes

```solidity
contract TrustedNodes newTrustedNodes
```

### constructor

```solidity
constructor(contract CurrencyGovernance _governance, contract TrustedNodes _newTrustedNodes) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## UpdateGovernanceEnacterProposal

### governance

```solidity
contract CurrencyGovernance governance
```

### newEnacter

```solidity
contract MonetaryPolicyAdapter newEnacter
```

### constructor

```solidity
constructor(contract CurrencyGovernance _governance, contract MonetaryPolicyAdapter _newEnacter) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## UpdateAdapterGovernanceProposal

### enacter

```solidity
contract MonetaryPolicyAdapter enacter
```

### newGovernance

```solidity
contract CurrencyGovernance newGovernance
```

### constructor

```solidity
constructor(contract MonetaryPolicyAdapter _enacter, contract CurrencyGovernance _newGovernance) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## UpdateLeverNotifierProposal

### lever

```solidity
contract Lever lever
```

### newNotifier

```solidity
contract Notifier newNotifier
```

### constructor

```solidity
constructor(contract Lever _lever, contract Notifier _newNotifier) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## UpdateLeverAuthorizedProposal

### lever

```solidity
contract Lever lever
```

### authorized

```solidity
address authorized
```

### permission

```solidity
bool permission
```

### constructor

```solidity
constructor(contract Lever _lever, address _authorized, bool _permission) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## UpdateNotifierLeverProposal

### notifier

```solidity
contract Notifier notifier
```

### newLever

```solidity
address newLever
```

### constructor

```solidity
constructor(contract Notifier _notifier, address _newLever) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## SweepLockupPenaltiesProposal

### lockups

```solidity
contract Lockups lockups
```

### destination

```solidity
address destination
```

### constructor

```solidity
constructor(contract Lockups _lockups, address _destination) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## UpdateTrustedNodesGovernanceProposal

### trustedNodes

```solidity
contract TrustedNodes trustedNodes
```

### newGovernance

```solidity
contract CurrencyGovernance newGovernance
```

### constructor

```solidity
constructor(contract TrustedNodes _trustedNodes, contract CurrencyGovernance _newGovernance) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

## SweepTrustedNodesProposal

### trustedNodes

```solidity
contract TrustedNodes trustedNodes
```

### destination

```solidity
address destination
```

### constructor

```solidity
constructor(contract TrustedNodes _trustedNodes, address _destination) public
```

### name

```solidity
function name() public pure returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() public pure returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() public pure returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address) public
```

