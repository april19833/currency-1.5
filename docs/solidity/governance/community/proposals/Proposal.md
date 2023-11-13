# Eco Association

Copyright (c) 2023 Eco Association

## Proposal

### name

```solidity
function name() external view returns (string)
```

The name of the proposal.

This should be relatively unique and descriptive.

### description

```solidity
function description() external view returns (string)
```

A longer description of what this proposal achieves.

### url

```solidity
function url() external view returns (string)
```

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

### enacted

```solidity
function enacted(address _self) external
```

Called to enact the proposal.

This will be called from the root policy contract using delegatecall,
with the direct proposal address passed in as _self so that storage
data can be accessed if needed.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | The address of the proposal contract. |

