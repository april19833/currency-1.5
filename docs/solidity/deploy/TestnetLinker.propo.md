# Eco Association

Copyright (c) 2023 Eco Association

## TestnetLinker

**Testnet Linking Proposal**

A proposal used to link upwards permissions for all necessary contracts and mint tokens

### distributor

```solidity
address distributor
```

### eco

```solidity
contract ECO eco
```

### ecox

```solidity
contract ECOx ecox
```

### communityGovernance

```solidity
address communityGovernance
```

### ecoXExchange

```solidity
address ecoXExchange
```

### lockups

```solidity
contract Lockups lockups
```

### lockupsNotifier

```solidity
contract Notifier lockupsNotifier
```

### rebase

```solidity
contract Rebase rebase
```

### rebaseNotifier

```solidity
contract Notifier rebaseNotifier
```

### monetaryPolicyAdapter

```solidity
contract MonetaryPolicyAdapter monetaryPolicyAdapter
```

### currencyGovernance

```solidity
contract CurrencyGovernance currencyGovernance
```

### trustedNodes

```solidity
contract TrustedNodes trustedNodes
```

### initialECOSupply

```solidity
uint256 initialECOSupply
```

### initialECOxSupply

```solidity
uint256 initialECOxSupply
```

### constructor

```solidity
constructor(address _communityGovernance, contract ECOxExchange _ecoXExchange, contract Notifier _lockupsNotifier, contract Notifier _rebaseNotifier, contract TrustedNodes _trustedNodes, uint256 _initialECOSupply) public
```

### name

The name of the proposal.

```solidity
function name() public pure returns (string)
```

### description

A description of what the proposal does.

```solidity
function description() public pure returns (string)
```

### url

A URL for more information.

```solidity
function url() public pure returns (string)
```

### enacted

Enact the proposal.

```solidity
function enacted(address) public
```

