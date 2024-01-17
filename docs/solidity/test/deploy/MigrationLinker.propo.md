# Eco Association

Copyright (c) 2023 Eco Association

## MigrationLinker

**Migration Proposal

A proposal used to update the 1.0 proxies and link upwards permissions for all necessary contracts**

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

The address of the updating contract for proxies

```solidity
address implementationUpdatingTarget
```

### inflationMultiplierUpdatingTarget

The address of the updating contract for inflationMultiplier

```solidity
address inflationMultiplierUpdatingTarget
```

### constructor

```solidity
constructor(contract CommunityGovernance _communityGovernance, contract ECOxExchange _ecoXExchange, contract Notifier _rebaseNotifier, contract TrustedNodes _trustedNodes, address _newPolicyImpl, address _newEcoImpl, address _newEcoxImpl, address _newEcoxStakingImpl, address _implementationUpdatingTarget, address _inflationMultiplierUpdatingTarget) public
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

