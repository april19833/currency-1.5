# ECOxExchange









## Methods

### PRECISION_BITS

```solidity
function PRECISION_BITS() external view returns (uint8)
```



*bits of precision used in the exponentiation approximation*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### eco

```solidity
function eco() external view returns (contract ECO)
```



*ECO token contract*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ECO | undefined |

### ecoValueOf

```solidity
function ecoValueOf(uint256 _ecoXValue) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _ecoXValue | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### ecox

```solidity
function ecox() external view returns (contract ECOx)
```



*ECOx token contract*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ECOx | undefined |

### exchange

```solidity
function exchange(uint256 _ecoXValue) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _ecoXValue | uint256 | undefined |

### implementation

```solidity
function implementation() external view returns (address _impl)
```

Get the address of the proxy target contract.




#### Returns

| Name | Type | Description |
|---|---|---|
| _impl | address | undefined |

### initialSupply

```solidity
function initialSupply() external view returns (uint256)
```



*initial supply of ECOx at deployment*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### initialize

```solidity
function initialize(address _self) external nonpayable
```

Storage initialization of cloned contract This is used to initialize the storage of the forwarded contract, and should (typically) copy or repeat any work that would normally be done in the constructor of the proxied contract. Implementations of ForwardTarget should override this function, and chain to super.initialize(_self).



#### Parameters

| Name | Type | Description |
|---|---|---|
| _self | address | The address of the original contract instance (the one being              forwarded to). |

### policy

```solidity
function policy() external view returns (contract Policy)
```

The address of the root policy instance overseeing this instance. This address can be used for ERC1820 lookup of other components, ERC1820 lookup of role policies, and interaction with the policy hierarchy.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Policy | undefined |

### valueAt

```solidity
function valueAt(uint256 _ecoXValue) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _ecoXValue | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |



## Events

### NewPolicy

```solidity
event NewPolicy(contract Policy newPolicy, contract Policy oldPolicy)
```

emits when the policy contract is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| newPolicy  | contract Policy | undefined |
| oldPolicy  | contract Policy | undefined |



## Errors

### NonZeroPolicyAddr

```solidity
error NonZeroPolicyAddr()
```






### PolicyOnlyFunction

```solidity
error PolicyOnlyFunction()
```







