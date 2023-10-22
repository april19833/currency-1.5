# InflationSnapshots



> InflationSnapshots This implements a scaling inflation multiplier on all balances and votes. Changing this value (via implementing _rebase)





## Methods

### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() external view returns (bytes32)
```



*See {IERC20Permit-DOMAIN_SEPARATOR}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### INITIAL_INFLATION_MULTIPLIER

```solidity
function INITIAL_INFLATION_MULTIPLIER() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```



*See {IERC20-allowance}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |
| spender | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### approve

```solidity
function approve(address spender, uint256 amount) external nonpayable returns (bool)
```



*See {IERC20-approve}. Requirements: - `spender` cannot be the zero address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### balanceOf

```solidity
function balanceOf(address _owner) external view returns (uint256)
```

Access function to determine the token balance held by some address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### burn

```solidity
function burn(address _from, uint256 _value) external nonpayable
```



*burns tokens to a given address*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _from | address | the address whose tokens are being burned |
| _value | uint256 | the amount of tokens being burned |

### burners

```solidity
function burners(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### currentSnapshotId

```solidity
function currentSnapshotId() external view returns (uint32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint32 | undefined |

### decimals

```solidity
function decimals() external view returns (uint8)
```



*Returns the number of decimals used to get its user representation. For example, if `decimals` equals `2`, a balance of `505` tokens should be displayed to a user as `5.05` (`505 / 10 ** 2`). Tokens usually opt for a value of 18, imitating the relationship between Ether and Wei. This is the value {ERC20} uses, unless this function is overridden; NOTE: This information is only used for _display_ purposes: it in no way affects any of the arithmetic of the contract, including {IERC20-balanceOf} and {IERC20-transfer}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) external nonpayable returns (bool)
```



*Atomically decreases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address. - `spender` must have allowance for the caller of at least `subtractedValue`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| subtractedValue | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### delegate

```solidity
function delegate(address delegatee) external nonpayable
```



*Delegate all votes from the sender to `delegatee`. NOTE: This function assumes that you do not have partial delegations It will revert with &quot;ERC20Delegated: must have an undelegated amount available to cover delegation&quot; if you do*

#### Parameters

| Name | Type | Description |
|---|---|---|
| delegatee | address | undefined |

### delegateAmount

```solidity
function delegateAmount(address delegatee, uint256 amount) external nonpayable
```



*Delegate an `amount` of votes from the sender to `delegatee`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| delegatee | address | undefined |
| amount | uint256 | undefined |

### delegateBySig

```solidity
function delegateBySig(address delegator, address delegatee, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external nonpayable
```



*Delegate all votes from the sender to `delegatee`. NOTE: This function assumes that you do not have partial delegations It will revert with &quot;ERC20Delegated: must have an undelegated amount available to cover delegation&quot; if you do*

#### Parameters

| Name | Type | Description |
|---|---|---|
| delegator | address | undefined |
| delegatee | address | undefined |
| deadline | uint256 | undefined |
| v | uint8 | undefined |
| r | bytes32 | undefined |
| s | bytes32 | undefined |

### delegationFromAddressDisabled

```solidity
function delegationFromAddressDisabled(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

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

### delegationToAddressEnabled

```solidity
function delegationToAddressEnabled(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### disableDelegationTo

```solidity
function disableDelegationTo() external nonpayable
```



*Set yourself as no longer recieving delegates.*


### enableDelegationTo

```solidity
function enableDelegationTo() external nonpayable
```



*Set yourself as willing to recieve delegates.*


### enableVoting

```solidity
function enableVoting() external nonpayable
```






### getPrimaryDelegate

```solidity
function getPrimaryDelegate(address account) external view returns (address)
```



*Get the primary address `account` is currently delegating to. Defaults to the account address itself if none specified. The primary delegate is the one that is delegated any new funds the address recieves.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### implementation

```solidity
function implementation() external view returns (address _impl)
```

Get the address of the proxy target contract.




#### Returns

| Name | Type | Description |
|---|---|---|
| _impl | address | undefined |

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) external nonpayable returns (bool)
```



*Atomically increases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| addedValue | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### inflationMultiplier

```solidity
function inflationMultiplier() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### inflationMultiplierSnapshot

```solidity
function inflationMultiplierSnapshot() external view returns (uint256)
```






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

### isOwnDelegate

```solidity
function isOwnDelegate(address account) external view returns (bool)
```



*Returns true if the user has no amount of their balance delegated, otherwise false.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### mint

```solidity
function mint(address _to, uint256 _value) external nonpayable
```



*mints tokens to a given address*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _to | address | the address receiving tokens |
| _value | uint256 | the amount of tokens being minted |

### minters

```solidity
function minters(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### name

```solidity
function name() external view returns (string)
```



*Returns the name of the token.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### nonces

```solidity
function nonces(address owner) external view returns (uint256)
```



*See {IERC20Permit-nonces}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### pause

```solidity
function pause() external nonpayable
```

pauses transfers of this token

*only callable by the pauser*


### paused

```solidity
function paused() external view returns (bool)
```



*Returns true if the contract is paused, and false otherwise.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### pauser

```solidity
function pauser() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external nonpayable
```



*See {IERC20Permit-permit}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |
| spender | address | undefined |
| value | uint256 | undefined |
| deadline | uint256 | undefined |
| v | uint8 | undefined |
| r | bytes32 | undefined |
| s | bytes32 | undefined |

### policy

```solidity
function policy() external view returns (contract Policy)
```

The address of the root policy instance overseeing this instance. This address can be used for ERC1820 lookup of other components, ERC1820 lookup of role policies, and interaction with the policy hierarchy.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Policy | undefined |

### reenableDelegating

```solidity
function reenableDelegating() external nonpayable
```



*Set yourself as being able to delegate again. also disables delegating to you*


### revokeDelegation

```solidity
function revokeDelegation(address delegator) external nonpayable
```

A primary delegated individual can revoke delegations of unwanted delegators Useful for allowing yourself to call reenableDelegating after calling disableDelegationTo



#### Parameters

| Name | Type | Description |
|---|---|---|
| delegator | address | undefined |

### roleAdmin

```solidity
function roleAdmin() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### setPauser

```solidity
function setPauser(address _pauser) external nonpayable
```

set the given address as the pauser

*only the roleAdmin can call this function*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _pauser | address | The address that can pause this token |

### symbol

```solidity
function symbol() external view returns (string)
```



*Returns the symbol of the token, usually a shorter version of the name.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

Returns the total (inflation corrected) token supply




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalSupplySnapshot

```solidity
function totalSupplySnapshot() external view returns (uint256)
```

Returns the total (inflation corrected) token supply for the current snapshot




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### transfer

```solidity
function transfer(address recipient, uint256 amount) external nonpayable returns (bool)
```



*See {IERC20-transfer}. Requirements: - `recipient` cannot be the zero address. - the caller must have a balance of at least `amount`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| recipient | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) external nonpayable returns (bool)
```



*See {IERC20-transferFrom}. Emits an {Approval} event indicating the updated allowance. This is not required by the EIP. See the note at the beginning of {ERC20}. Requirements: - `sender` and `recipient` cannot be the zero address. - `sender` must have a balance of at least `amount`. - the caller must have allowance for ``sender``&#39;s tokens of at least `amount`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| sender | address | undefined |
| recipient | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### undelegate

```solidity
function undelegate() external nonpayable
```



*Undelegate all votes from the sender&#39;s primary delegate.*


### undelegateAmountFromAddress

```solidity
function undelegateAmountFromAddress(address delegatee, uint256 amount) external nonpayable
```



*Undelegate a specific amount of votes from the `delegatee` back to the sender.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| delegatee | address | undefined |
| amount | uint256 | undefined |

### undelegateFromAddress

```solidity
function undelegateFromAddress(address delegatee) external nonpayable
```



*Undelegate votes from the `delegatee` back to the sender.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| delegatee | address | undefined |

### unpause

```solidity
function unpause() external nonpayable
```

unpauses transfers of this token

*only callable by the pauser*


### updateBurners

```solidity
function updateBurners(address _key, bool _value) external nonpayable
```



*change the burning permissions for an address only callable by tokenRoleAdmin*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can burn, false = cannot burn |

### updateMinters

```solidity
function updateMinters(address _key, bool _value) external nonpayable
```



*change the minting permissions for an address only callable by tokenRoleAdmin*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _key | address | the address to change permissions for |
| _value | bool | the new permission. true = can mint, false = cannot mint |

### voteBalanceOf

```solidity
function voteBalanceOf(address _owner) external view returns (uint256)
```

Access function to determine the voting balance (includes delegation) of some address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### voteBalanceSnapshot

```solidity
function voteBalanceSnapshot(address account) external view returns (uint256)
```

Return snapshotted voting balance (includes delegation) for the current snapshot.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | The account to check the votes of. |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### voter

```solidity
function voter(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |



## Events

### Approval

```solidity
event Approval(address indexed owner, address indexed spender, uint256 value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| spender `indexed` | address | undefined |
| value  | uint256 | undefined |

### BaseValueTransfer

```solidity
event BaseValueTransfer(address indexed from, address indexed to, uint256 value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| to `indexed` | address | undefined |
| value  | uint256 | undefined |

### DelegatedVotes

```solidity
event DelegatedVotes(address indexed delegator, address indexed delegatee, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| delegator `indexed` | address | undefined |
| delegatee `indexed` | address | undefined |
| amount  | uint256 | undefined |

### NewInflationMultiplier

```solidity
event NewInflationMultiplier(uint256 adjustinginflationMultiplier, uint256 cumulativeInflationMultiplier)
```

Fired when a proposal with a new inflation multiplier is selected and passed. Used to calculate new values for the rebased token.



#### Parameters

| Name | Type | Description |
|---|---|---|
| adjustinginflationMultiplier  | uint256 | the multiplier that has just been applied to the tokens |
| cumulativeInflationMultiplier  | uint256 | the total multiplier that is used to convert to and from gons |

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

### NewPrimaryDelegate

```solidity
event NewPrimaryDelegate(address indexed delegator, address indexed primaryDelegate)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| delegator `indexed` | address | undefined |
| primaryDelegate `indexed` | address | undefined |

### NewSnapshotId

```solidity
event NewSnapshotId(uint256 id)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id  | uint256 | undefined |

### Paused

```solidity
event Paused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### PauserAssignment

```solidity
event PauserAssignment(address indexed pauser)
```

event indicating the pauser was updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| pauser `indexed` | address | undefined |

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| to `indexed` | address | undefined |
| value  | uint256 | undefined |

### Unpaused

```solidity
event Unpaused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### UpdatedBurners

```solidity
event UpdatedBurners(address actor, bool newPermission)
```

emits when the burners permissions are changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| actor  | address | undefined |
| newPermission  | bool | undefined |

### UpdatedMinters

```solidity
event UpdatedMinters(address actor, bool newPermission)
```

emits when the minters permissions are changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| actor  | address | undefined |
| newPermission  | bool | undefined |

### VoteTransfer

```solidity
event VoteTransfer(address indexed sendingVoter, address indexed recievingVoter, uint256 votes)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| sendingVoter `indexed` | address | undefined |
| recievingVoter `indexed` | address | undefined |
| votes  | uint256 | undefined |



## Errors

### BadRebaseValue

```solidity
error BadRebaseValue()
```

error for when a rebase attempts to rebase incorrectly




### NonZeroPolicyAddr

```solidity
error NonZeroPolicyAddr()
```






### OnlyBurners

```solidity
error OnlyBurners()
```



*error for when an address tries to burn tokens without permission*


### OnlyMinters

```solidity
error OnlyMinters()
```



*error for when an address tries to mint tokens without permission*


### PolicyOnlyFunction

```solidity
error PolicyOnlyFunction()
```







