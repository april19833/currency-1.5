# Lockups



> Lockups This provides deposit certificate functionality for the purpose of countering inflationary effects. Deposits can be made and interest will be paid out to those who make deposits. Deposit principal is accessable before the interested period but for a penalty of not retrieving your gained interest as well as an additional penalty of that same amount.





## Methods

### MAX_DURATION

```solidity
function MAX_DURATION() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### MAX_RATE

```solidity
function MAX_RATE() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### MIN_DURATION

```solidity
function MIN_DURATION() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### authorized

```solidity
function authorized(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### createLockup

```solidity
function createLockup(uint256 _duration, uint256 _rate) external nonpayable
```

Creates a lockup



#### Parameters

| Name | Type | Description |
|---|---|---|
| _duration | uint256 | the time after lockup window closes that a user has to keep their funds locked up in order to receive yield |
| _rate | uint256 | the yield (based on inflationMultiplier at time of lockup creation) a depositor who waits the full duration will earn |

### currentInflationMultiplier

```solidity
function currentInflationMultiplier() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### deposit

```solidity
function deposit(uint256 _lockupId, uint256 _amount) external nonpayable
```

User deposits on their own behalf. Requires that the user has approved this contract to transfer _amount of their eco.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lockupId | uint256 | ID of the lockup being deposited to |
| _amount | uint256 | the amount being deposited |

### depositFor

```solidity
function depositFor(uint256 _lockupId, address _beneficiary, uint256 _amount) external nonpayable
```

User deposits on someone else&#39;s behalf. Requires that the beneficiary has approved this contract to transfer _amount of their eco.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lockupId | uint256 | ID of the lockup being deposited to |
| _beneficiary | address | the person whose eco is being deposited |
| _amount | uint256 | the amount being deposited |

### depositWindow

```solidity
function depositWindow() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### eco

```solidity
function eco() external view returns (contract ECO)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ECO | undefined |

### getBalance

```solidity
function getBalance(uint256 _lockupId, address _who) external view returns (uint256 ecoAmount)
```

getter function for inflation-adjusted deposits



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lockupId | uint256 | the ID of the lockup |
| _who | address | address whose balance is being fetched |

#### Returns

| Name | Type | Description |
|---|---|---|
| ecoAmount | uint256 | undefined |

### getGonsBalance

```solidity
function getGonsBalance(uint256 _lockupId, address _who) external view returns (uint256 ecoAmount)
```

getter function for gonsBalances



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lockupId | uint256 | the ID of the lockup |
| _who | address | address whose gons balance is being fetched |

#### Returns

| Name | Type | Description |
|---|---|---|
| ecoAmount | uint256 | undefined |

### getYield

```solidity
function getYield(uint256 _lockupId, address _who) external view returns (uint256 ecoAmount)
```

getter function for yield



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lockupId | uint256 | the ID of the lockup |
| _who | address | address whose balance is being fetched |

#### Returns

| Name | Type | Description |
|---|---|---|
| ecoAmount | uint256 | undefined |

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

### lockups

```solidity
function lockups(uint256) external view returns (uint256 rate, uint256 depositWindowEnd, uint256 end)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| rate | uint256 | undefined |
| depositWindowEnd | uint256 | undefined |
| end | uint256 | undefined |

### notifier

```solidity
function notifier() external view returns (contract Notifier)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Notifier | undefined |

### policy

```solidity
function policy() external view returns (contract Policy)
```

The address of the root policy instance overseeing this instance. This address can be used for ERC1820 lookup of other components, ERC1820 lookup of role policies, and interaction with the policy hierarchy.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Policy | undefined |

### setAuthorized

```solidity
function setAuthorized(address _agent, bool _status) external nonpayable
```

Changes the authorized status of an address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _agent | address | The address whose status is changing |
| _status | bool | The new status of _agent |

### setNotifier

```solidity
function setNotifier(contract Notifier _notifier) external nonpayable
```

Changes the notifier for the lever.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _notifier | contract Notifier | The new notifier address |

### sweep

```solidity
function sweep(address _destination) external nonpayable
```

sweep accumulated penalty eco to a destination address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _destination | address | the address that will receive |

### updateInflationMultiplier

```solidity
function updateInflationMultiplier() external nonpayable
```






### withdraw

```solidity
function withdraw(uint256 _lockupId) external nonpayable
```

User withdraws their own funds. Withdrawing before the lockup has ended will result in a forfeiture of yield and penalty equal to that yield.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lockupId | uint256 | the ID of the lockup being withdrawn from |

### withdrawFor

```solidity
function withdrawFor(uint256 _lockupId, address _recipient) external nonpayable
```

User withdraws recipient&#39;s funds to recipient. Reverts if withdrawn prior to lockup ending



#### Parameters

| Name | Type | Description |
|---|---|---|
| _lockupId | uint256 | the ID of the lockup being withdrawn from |
| _recipient | address | address to receive eco |



## Events

### AuthorizationChanged

```solidity
event AuthorizationChanged(address agent, bool status)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| agent  | address | undefined |
| status  | bool | undefined |

### LockupCreation

```solidity
event LockupCreation(uint256 lockupId, uint256 duration, uint256 rate)
```

lockup created



#### Parameters

| Name | Type | Description |
|---|---|---|
| lockupId  | uint256 | : ID of lockup |
| duration  | uint256 | : duration of lockup |
| rate  | uint256 | : yield rate of lockup at creation |

### LockupDeposit

```solidity
event LockupDeposit(uint256 lockupId, address depositor, uint256 gonsDepositAmount)
```

deposit made to lockup



#### Parameters

| Name | Type | Description |
|---|---|---|
| lockupId  | uint256 | : ID of lockup |
| depositor  | address | : address whose ECO were deposited |
| gonsDepositAmount  | uint256 | : amount in gons that was deposited to lockup |

### LockupWithdrawal

```solidity
event LockupWithdrawal(uint256 lockupId, address recipient, uint256 gonsWithdrawnAmount)
```

withdrawal made from lockup



#### Parameters

| Name | Type | Description |
|---|---|---|
| lockupId  | uint256 | : ID of lockup |
| recipient  | address | : address receiving withdrawal |
| gonsWithdrawnAmount  | uint256 | : amount in gons that was withdrawn |

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

### NotifierChanged

```solidity
event NotifierChanged(contract Notifier oldNotifier, contract Notifier newNotifier)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| oldNotifier  | contract Notifier | undefined |
| newNotifier  | contract Notifier | undefined |



## Errors

### AuthorizedOnly

```solidity
error AuthorizedOnly()
```






### BadDuration

```solidity
error BadDuration()
```






### BadRate

```solidity
error BadRate()
```






### EarlyWithdrawFor

```solidity
error EarlyWithdrawFor(uint256 lockupId, address withdrawer, address recipient)
```

withdrawFor called before lockup end



#### Parameters

| Name | Type | Description |
|---|---|---|
| lockupId | uint256 | : ID of lockup from which withdrawal was attempted |
| withdrawer | address | : address that called withdrawFor |
| recipient | address | : address on whose behalf withdrawFor was called |

### LateDeposit

```solidity
error LateDeposit(uint256 lockupId, address depositor)
```

attempted deposit after deposit window has closed



#### Parameters

| Name | Type | Description |
|---|---|---|
| lockupId | uint256 | : ID of lockup to which deposit was attempted |
| depositor | address | : address that tried to deposit |

### NonZeroPolicyAddr

```solidity
error NonZeroPolicyAddr()
```






### PolicyOnlyFunction

```solidity
error PolicyOnlyFunction()
```







