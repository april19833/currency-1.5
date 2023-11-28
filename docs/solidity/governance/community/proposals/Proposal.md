# Eco Association

Copyright (c) 2023 Eco Association

## Proposal

**Proposal**

_Interface specification for proposals. Any proposal submitted in the
policy decision process must implement this interface._

### name

_The name of the proposal.

This should be relatively unique and descriptive._

  ```solidity
  function name() external view returns (string)
  ```

### description

_A longer description of what this proposal achieves._

  ```solidity
  function description() external view returns (string)
  ```

### url

_A URL where voters can go to see the case in favour of this proposal,
and learn more about it._

  ```solidity
  function url() external view returns (string)
  ```

### enacted

_Called to enact the proposal.

This will be called from the root policy contract using delegatecall,
with the direct proposal address passed in as _self so that storage
data can be accessed if needed._

  ```solidity
  function enacted(address _self) external
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | The address of the proposal contract. |

