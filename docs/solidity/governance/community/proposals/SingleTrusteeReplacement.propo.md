# Eco Association

Copyright (c) 2023 Eco Association

## SingleTrusteeReplacement

**SingleTrusteeReplacement
A proposal to replace one trustee**

### trustedNodes

```solidity
contract TrustedNodes trustedNodes
```

### oldTrustee

```solidity
address oldTrustee
```

### newTrustee

```solidity
address newTrustee
```

### constructor

Instantiate a new proposal.

```solidity
constructor(contract TrustedNodes _trustedNodes, address _oldTrustee, address _newTrustee) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _trustedNodes | contract TrustedNodes |  |
| _oldTrustee | address | The existing trustee to distrust |
| _newTrustee | address | The new address to become trusted |

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

A URL where more details can be found.

```solidity
function url() public pure returns (string)
```

### enacted

Enact the proposal.

This is executed in the storage context of the root policy contract.

```solidity
function enacted(address) public
```

