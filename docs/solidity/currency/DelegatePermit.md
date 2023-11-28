# Eco Association

Copyright (c) 2023 Eco Association

## DelegatePermit

_Abstract contract including helper functions to allow delegation by signature using
[EIP-2612](https://eips.ethereum.org/EIPS/eip-2612).

Adds the `{_verifyDelegatePermit}` internal method, verifies a signature specifying permission to receive delegation power_

### _verifyDelegatePermit

_Verify that the given delegate signature is valid, throws if not_

  ```solidity
  function _verifyDelegatePermit(address delegator, address delegatee, uint256 deadline, uint8 v, bytes32 r, bytes32 s) internal
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegator | address | The address delegating |
| delegatee | address | The address being delegated to |
| deadline | uint256 | The deadling of the delegation after which it will be invalid |
| v | uint8 | The v part of the signature |
| r | bytes32 | The r part of the signature |
| s | bytes32 | The s part of the signature |

### delegationNonce

_get the current nonce for the given address_

  ```solidity
  function delegationNonce(address owner) public view returns (uint256)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address to get nonce for |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | nonce current nonce of `owner` |

