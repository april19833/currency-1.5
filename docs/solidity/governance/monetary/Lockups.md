# Eco Association

Copyright (c) 2023 Eco Association

## Lockups

**Lockups**

This provides deposit certificate functionality for the purpose of countering
inflationary effects.

Deposits can be made and interest will be paid out to those who make
deposits. Deposit principal is accessable before the interested period
but for a penalty of not retrieving your gained interest as well as an
additional penalty of that same amount.

### Lockup

```solidity
struct Lockup {
  uint256 rate;
  uint256 depositWindowEnd;
  uint256 end;
  mapping(address => uint256) gonsBalances;
  mapping(address => uint256) interest;
  mapping(address => address) delegates;
}
```

### BASE

```solidity
uint256 BASE
```

### MAX_RATE

```solidity
uint256 MAX_RATE
```

### MIN_DURATION

```solidity
uint256 MIN_DURATION
```

### MAX_DURATION

```solidity
uint256 MAX_DURATION
```

### nextId

```solidity
uint256 nextId
```

### eco

```solidity
contract ECO eco
```

### depositWindow

```solidity
uint256 depositWindow
```

### currentInflationMultiplier

```solidity
uint256 currentInflationMultiplier
```

### lockups

```solidity
mapping(uint256 => struct Lockups.Lockup) lockups
```

### penalties

```solidity
uint256 penalties
```

### BadRate

```solidity
error BadRate()
```

### BadDuration

```solidity
error BadDuration()
```

### EarlyWithdrawFor

withdrawFor called before lockup end

```solidity
error EarlyWithdrawFor(uint256 lockupId, address withdrawer, address recipient)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| lockupId | uint256 | ID of lockup from which withdrawal was attempted |
| withdrawer | address | address that called withdrawFor |
| recipient | address | address on whose behalf withdrawFor was called |

### LateDeposit

attempted deposit after deposit window has closed

```solidity
error LateDeposit(uint256 lockupId, address depositor)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| lockupId | uint256 | ID of lockup to which deposit was attempted |
| depositor | address | address that tried to deposit |

### LockupCreation

lockup created

```solidity
event LockupCreation(uint256 lockupId, uint256 duration, uint256 rate)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| lockupId | uint256 | ID of lockup |
| duration | uint256 | duration of lockup |
| rate | uint256 | yield rate of lockup at creation |

### LockupDeposit

deposit made to lockup

```solidity
event LockupDeposit(uint256 lockupId, address depositor, uint256 gonsDepositAmount)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| lockupId | uint256 | ID of lockup |
| depositor | address | address whose ECO were deposited |
| gonsDepositAmount | uint256 | amount in gons that was deposited to lockup |

### LockupWithdrawal

withdrawal made from lockup

```solidity
event LockupWithdrawal(uint256 lockupId, address recipient, uint256 gonsWithdrawnAmount)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| lockupId | uint256 | ID of lockup |
| recipient | address | address receiving withdrawal |
| gonsWithdrawnAmount | uint256 | amount in gons that was withdrawn |

### constructor

constructor

```solidity
constructor(contract Policy _policy, contract ECO _eco, uint256 _depositWindow) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | the owning policy address for the contract |
| _eco | contract ECO | the ECO contract |
| _depositWindow | uint256 | length of the deposit window |

### createLockup

Creates a lockup

```solidity
function createLockup(uint256 _duration, uint256 _rate) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _duration | uint256 | the time after lockup window closes that a user has to keep their funds locked up in order to receive yield |
| _rate | uint256 | the yield (based on inflationMultiplier at time of lockup creation) a depositor who waits the full duration will earn |

### deposit

User deposits on their own behalf. Requires that the user has approved this contract
to transfer _amount of their eco.

```solidity
function deposit(uint256 _lockupId, uint256 _amount) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lockupId | uint256 | ID of the lockup being deposited to |
| _amount | uint256 | the amount being deposited |

### depositFor

User deposits on someone else's behalf. Requires that the beneficiary has approved this contract
to transfer _amount of their eco.

```solidity
function depositFor(uint256 _lockupId, address _beneficiary, uint256 _amount) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lockupId | uint256 | ID of the lockup being deposited to |
| _beneficiary | address | the person whose eco is being deposited |
| _amount | uint256 | the amount being deposited |

### _deposit

```solidity
function _deposit(uint256 _lockupId, address _beneficiary, uint256 _amount) internal
```

### withdraw

User withdraws their own funds. Withdrawing before the lockup has ended will result in a
forfeiture of yield and penalty equal to that yield.

```solidity
function withdraw(uint256 _lockupId) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lockupId | uint256 | the ID of the lockup being withdrawn from |

### withdrawFor

User withdraws recipient's funds to recipient. Reverts if withdrawn prior to lockup ending

```solidity
function withdrawFor(uint256 _lockupId, address _recipient) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lockupId | uint256 | the ID of the lockup being withdrawn from |
| _recipient | address | address to receive eco |

### _withdraw

```solidity
function _withdraw(uint256 _lockupId, address _recipient) internal
```

### getGonsBalance

getter function for gonsBalances

```solidity
function getGonsBalance(uint256 _lockupId, address _who) public view returns (uint256 gonsAmount)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lockupId | uint256 | the ID of the lockup |
| _who | address | address whose gons balance is being fetched |

### getBalance

getter function for inflation-adjusted deposits

```solidity
function getBalance(uint256 _lockupId, address _who) public view returns (uint256 ecoAmount)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lockupId | uint256 | the ID of the lockup |
| _who | address | address whose balance is being fetched |

### getYield

getter function for yield

```solidity
function getYield(uint256 _lockupId, address _who) public view returns (uint256 ecoAmount)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lockupId | uint256 | the ID of the lockup |
| _who | address | address whose balance is being fetched |

### getDelegate

getter function for yield

```solidity
function getDelegate(uint256 _lockupId, address _who) public view returns (address lockupDelegate)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lockupId | uint256 | the ID of the lockup |
| _who | address | address whose delegate is being fetched |

### sweep

sweep accumulated penalty eco to a destination address

```solidity
function sweep(address _destination) external
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destination | address | the address that will receive |

### updateInflationMultiplier

updates currentInflationMultiplier

this function needs to be called each time the currency rebases to keep the inflation multiplier current for the lockup

```solidity
function updateInflationMultiplier() external
```

