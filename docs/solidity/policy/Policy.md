# Policy



> The policy contract that oversees other contracts Policy contracts provide a mechanism for building pluggable (after deploy) governance systems for other contracts.





## Methods

### implementation

```solidity
function implementation() external view returns (address _impl)
```

Get the address of the proxy target contract.




#### Returns

| Name | Type | Description |
|---|---|---|
| _impl | address | undefined |

### initialize

```solidity
function initialize(address _self) external nonpayable
```

Storage initialization of cloned contract This is used to initialize the storage of the forwarded contract, and should (typically) copy or repeat any work that would normally be done in the constructor of the proxied contract. Implementations of ForwardTarget should override this function, and chain to super.initialize(_self).



#### Parameters

| Name | Type | Description |
|---|---|---|
| _self | address | The address of the original contract instance (the one being              forwarded to). |

### internalCommand

```solidity
function internalCommand(address _delegate, bytes32 _authKey) external nonpayable
```

Enact the code of one of the governance contracts.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _delegate | address | The contract code to delegate execution to. |
| _authKey | bytes32 | undefined |

### removeSelf

```solidity
function removeSelf(bytes32 _interfaceIdentifierHash) external nonpayable
```

Remove the specified role from the contract calling this function. This is for cleanup only, so if another contract has taken the role, this does nothing.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _interfaceIdentifierHash | bytes32 | The interface identifier to remove from                                 the registry. |

### setPolicy

```solidity
function setPolicy(bytes32 _key, address _implementer, bytes32 _authKey) external nonpayable
```

Set the policy label for a contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| _key | bytes32 | The label to apply to the contract. |
| _implementer | address | The contract to assume the label. |
| _authKey | bytes32 | undefined |

### setters

```solidity
function setters(bytes32) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |




