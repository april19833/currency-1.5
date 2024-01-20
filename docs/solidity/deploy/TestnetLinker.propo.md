# Eco Association

Copyright (c) 2023 Eco Association

## TestnetLinker

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

```solidity
function name() public pure returns (string)
```

The name of the proposal.

### description

```solidity
function description() public pure returns (string)
```

A description of what the proposal does.

### url

```solidity
function url() public pure returns (string)
```

A URL for more information.

### enacted

```solidity
function enacted(address) public
```

Enact the proposal.
