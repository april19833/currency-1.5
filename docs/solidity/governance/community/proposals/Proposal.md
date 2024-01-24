# Eco Association

Copyright (c) 2023 Eco Association

## Proposal

**Proposal**

Interface specification for proposals. Any proposal submitted in the
policy decision process must implement this interface.

### name

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
function name() external view returns (string name)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The name of the proposal |

### description

A longer description of what this proposal achieves.

```solidity
function description() external view returns (string description)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| description | string | A longer description of what this proposal achieves. |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
function url() external view returns (string url)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| url | string | A URL where voters can go to see the case in favour of this proposal |

### enacted

Called to enact the proposal.

This will be called from the root policy contract using delegatecall,
with the direct proposal address passed in as _self so that storage
data can be accessed if needed.

```solidity
function enacted(address _self) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | The address of the proposal contract. |

