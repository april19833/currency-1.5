# Eco Association

Copyright (c) 2023 Eco Association

## UpdatePolicedProxyImplProposal

**upgrade PolicedUpgradeable proxy implementation proposal

A proposal used to change the implmentation for one of the protocol's proxies**

### targetProxy

```solidity
contract PolicedUpgradeable targetProxy
```

### newImpl

```solidity
address newImpl
```

### constructor

```solidity
constructor(contract PolicedUpgradeable _targetProxy, address _newImpl) public
```

### name

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() public pure returns (string)
```

### description

A longer description of what this proposal achieves.

```solidity
function description() public pure returns (string)
```

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() public pure returns (string)
```

### enacted

```solidity
function enacted(address) public
```

