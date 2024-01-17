# Eco Association

Copyright (c) 2023 Eco Association

## Wrapper

### HereIAm

```solidity
event HereIAm(uint256 index)
```

### whoAmI

```solidity
function whoAmI() external returns (uint256)
```

## UpgradedWrapper

### HereIAm

```solidity
event HereIAm(uint256 index)
```

### whoAmI

```solidity
function whoAmI() external returns (uint256)
```

## OZProxy

### constructor

```solidity
constructor(address _wrapper, address _policy) public
```

### whoAmI

```solidity
function whoAmI() external returns (uint256)
```

### whoAmINonAdmin

```solidity
function whoAmINonAdmin() external pure returns (uint256)
```

## WrapperUpgradeProposal

### upgradedWrapper

```solidity
contract UpgradedWrapper upgradedWrapper
```

### ozProxy

```solidity
contract OZProxy ozProxy
```

### constructor

```solidity
constructor(contract UpgradedWrapper _upgradedWrapper, contract OZProxy _ozProxy) public
```

### name

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() external pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### description

A longer description of what this proposal achieves.

```solidity
function description() external pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() external pure returns (string)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### enacted

```solidity
function enacted(address) external
```

