# Eco Association

Copyright (c) 2023 Eco Association

## MigrationLinker

### newEcoImpl

```solidity
address newEcoImpl
```

### ecoProxyAddress

```solidity
address ecoProxyAddress
```

### newEcoxImpl

```solidity
address newEcoxImpl
```

### ecoxProxyAddress

```solidity
address ecoxProxyAddress
```

### newEcoxStakingImpl

```solidity
address newEcoxStakingImpl
```

### ecoXStakingProxyAddress

```solidity
address ecoXStakingProxyAddress
```

### communityGovernance

```solidity
contract CommunityGovernance communityGovernance
```

### ecoXExchange

```solidity
contract ECOxExchange ecoXExchange
```

### rebase

```solidity
address rebase
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

### newPolicyImpl

```solidity
address newPolicyImpl
```

### implementationUpdatingTarget

```solidity
address implementationUpdatingTarget
```

The address of the updating contract for proxies

### inflationMultiplierUpdatingTarget

```solidity
address inflationMultiplierUpdatingTarget
```

The address of the updating contract for inflationMultiplier

### constructor

```solidity
constructor(contract CommunityGovernance _communityGovernance, contract ECOxExchange _ecoXExchange, contract Notifier _rebaseNotifier, contract TrustedNodes _trustedNodes, address _newPolicyImpl, address _newEcoImpl, address _newEcoxImpl, address _newEcoxStakingImpl, address _implementationUpdatingTarget, address _inflationMultiplierUpdatingTarget) public
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

