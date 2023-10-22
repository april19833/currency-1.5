# TrustedNodesFactory









## Methods

### currencyGovernance

```solidity
function currencyGovernance() external view returns (contract CurrencyGovernance)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract CurrencyGovernance | undefined |

### ecoX

```solidity
function ecoX() external view returns (contract ECOx)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ECOx | undefined |

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

### newCohort

```solidity
function newCohort(uint256 _termLength, uint256 _voteReward, address[] _newTrustees) external nonpayable returns (address)
```

Deploys a new TrustedNodes instance



#### Parameters

| Name | Type | Description |
|---|---|---|
| _termLength | uint256 | the length of term for trustees in the new cohort |
| _voteReward | uint256 | the reward earned by each trustee each time they participate in voting |
| _newTrustees | address[] | the new cohort of trustees |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### policy

```solidity
function policy() external view returns (contract Policy)
```

The address of the root policy instance overseeing this instance. This address can be used for ERC1820 lookup of other components, ERC1820 lookup of role policies, and interaction with the policy hierarchy.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Policy | undefined |

### updateCurrencyGovernance

```solidity
function updateCurrencyGovernance(contract CurrencyGovernance _currencyGovernance) external nonpayable
```

Changes the holder currencyGovernance role



#### Parameters

| Name | Type | Description |
|---|---|---|
| _currencyGovernance | contract CurrencyGovernance | the new currencyGovernance role holder |



## Events

### NewCohort

```solidity
event NewCohort(contract TrustedNodes trustedNodes)
```

Event emitted when a new cohort is deployed



#### Parameters

| Name | Type | Description |
|---|---|---|
| trustedNodes  | contract TrustedNodes | the address of the deployed cohort |

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







