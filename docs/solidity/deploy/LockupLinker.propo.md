# Eco Association

Copyright (c) 2023 Eco Association

## LockupLinker

**Lockup-only Linking Proposal

A proposal used to link upwards permissions for the lockup contract which must be deployed after the migration**

### eco

```solidity
contract ECO eco
```

### lockups

```solidity
address lockups
```

### lockupsNotifier

```solidity
contract Notifier lockupsNotifier
```

### monetaryPolicyAdapter

```solidity
address monetaryPolicyAdapter
```

### constructor

```solidity
constructor(contract Notifier _lockupsNotifier, address _monetaryPolicyAdapter) public
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

