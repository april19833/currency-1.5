# DelegatePermit







*Abstract contract including helper functions to allow delegation by signature using https://eips.ethereum.org/EIPS/eip-2612[EIP-2612]. Adds the {_verifyDelegatePermit} internal method, verifies a signature specifying permission to receive delegation power*

## Methods

### delegationNonce

```solidity
function delegationNonce(address owner) external view returns (uint256)
```

get the current nonce for the given address



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | The address to get nonce for |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | the current nonce of `owner` |




