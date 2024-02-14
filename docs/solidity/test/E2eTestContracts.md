# Eco Association

Copyright (c) 2023 Eco Association

## MinterProposal

**MinterProposal

A proposal used for changing a minter**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## BurnerProposal

**BurnerProposal

A proposal used for changing a burner**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## RebaserProposal

**RebaserProposal

A proposal used for changing a rebaser**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## SnapshotterProposal

**SnapshotterProposal

A proposal used for changing a snapshotter**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## UpdateTokenPauserProposal

**token new pauser proposal

A proposal used for changing the pauser on the tokens**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## UpdateGovernancePauserProposal

**governance new pauser proposal

A proposal used for changing the pauser on the community governance contract**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## UpdateSupportThresholdPercent

**governance new supportThresholdPercent proposal

A proposal used for changing the support threshold percent on the community governance contract**

### governance

```solidity
contract CommunityGovernance governance
```

### newSupportThresholdPercent

```solidity
uint256 newSupportThresholdPercent
```

### constructor

```solidity
constructor(contract CommunityGovernance _governance, uint256 _newSupportThresholdPercent) public
```

### name

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## SweepGovernanceFeesProposal

**governance fee sweep proposal

A proposal used for sweeping the fees collected by the community governance contract to an address**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## UpdateGovernanceTrustedNodesProposal

**governance new trustedNodes proposal

A proposal used to change the trustedNodes contract for the currency governance**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## UpdateGovernanceEnacterProposal

**governance new enacter proposal

A proposal used to change the enacter contract for the currency governance**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## UpdateAdapterGovernanceProposal

**adapter new governance proposal

A proposal used to change the governance contract for the monetary policy adapter**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## UpdateLeverNotifierProposal

**lever new notifier proposal

A proposal used to change the notifier contract for a monetary policy lever**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## UpdateLeverAuthorizedProposal

**update lever authorized proposal

A proposal used to add or remove an authorized caller of the lever**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## UpdateNotifierLeverProposal

**notifier new lever proposal

A proposal used to change the lever contract for a notifier**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## SweepLockupPenaltiesProposal

**lockups sweep penalties proposal

A proposal used to sweep the penalties accrued in the lockups contract to an address**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## UpdateTrustedNodesGovernanceProposal

**trusted nodes new governance proposal

A proposal used to change the governance contract for the trusted nodes contract**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

## SweepTrustedNodesProposal

**trusted nodes sweep ecox proposal

A proposal used to sweep the ecox accrued in the trusted nodes contract to an address**

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

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) public
```

