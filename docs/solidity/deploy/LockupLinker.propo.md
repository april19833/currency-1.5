# Eco Association

Copyright (c) 2023 Eco Association

## LockupLinker

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

