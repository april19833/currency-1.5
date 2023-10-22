# VoteCheckpoints







*Extension of ERC20 to support Compound-like voting and delegation. This version is more generic than Compound&#39;s, and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1. This extension keeps a history (checkpoints) of each account&#39;s vote power. Vote power can be delegated either by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting power can be queried through the public accessors {getVotingGons} and {getPastVotingGons}. By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked. Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this will significantly increase the base gas cost of transfers. _Available since v4.2._*

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
function balanceOf(address account) external view returns (uint256)
```



*See {IERC20-balanceOf}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### checkpoints

```solidity
function checkpoints(address, uint256) external view returns (uint32 fromBlock, uint224 value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| fromBlock | uint32 | undefined |
| value | uint224 | undefined |

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



*Delegate all votes from the sender to `delegatee`. NOTE: This function assumes that you do not have partial delegations It will revert with &quot;Must have an undelegated amount available to cover delegation&quot; if you do*

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



*Delegate all votes from the sender to `delegatee`. NOTE: This function assumes that you do not have partial delegations It will revert with &quot;Must have an undelegated amount available to cover delegation&quot; if you do*

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


### getPastTotalSupply

```solidity
function getPastTotalSupply(uint256 blockNumber) external view returns (uint256)
```



*Retrieve the `totalSupply` at the end of `blockNumber`. Note, this value is the sum of all balances. It is NOT the sum of all the delegated votes! Requirements: - `blockNumber` must have been already mined*

#### Parameters

| Name | Type | Description |
|---|---|---|
| blockNumber | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getPastVotes

```solidity
function getPastVotes(address _owner, uint256 _blockNumber) external view returns (uint256)
```

Return historical voting balance (includes delegation) at given block number. If the latest block number for the account is before the requested block then the most recent known balance is returned. Otherwise the exact block number requested is returned.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner | address | The account to check the balance of. |
| _blockNumber | uint256 | The block number to check the balance at the start                        of. Must be less than or equal to the present                        block number. |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getPastVotingGons

```solidity
function getPastVotingGons(address account, uint256 blockNumber) external view returns (uint256)
```



*Retrieve the number of votes in gons for `account` at the end of `blockNumber`. Requirements: - `blockNumber` must have been already mined*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| blockNumber | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### getVotingGons

```solidity
function getVotingGons(address account) external view returns (uint256)
```



*Gets the current votes balance in gons for `account`*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### numCheckpoints

```solidity
function numCheckpoints(address account) external view returns (uint32)
```



*Get number of checkpoints for `account`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint32 | undefined |

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

### reenableDelegating

```solidity
function reenableDelegating() external nonpayable
```



*Set yourself as being able to delegate again. also disables delegating to you NOTE: the condition for this is not easy and cannot be unilaterally achieved*


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



*See {IERC20-totalSupply}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### totalSupplyAt

```solidity
function totalSupplyAt(uint256 _blockNumber) external view returns (uint256)
```

Returns the total (inflation corrected) token supply at a specified block number



#### Parameters

| Name | Type | Description |
|---|---|---|
| _blockNumber | uint256 | undefined |

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

### DelegatedVotes

```solidity
event DelegatedVotes(address indexed delegator, address indexed delegatee, uint256 amount)
```



*Emitted when a delegatee is delegated new votes.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| delegator `indexed` | address | undefined |
| delegatee `indexed` | address | undefined |
| amount  | uint256 | undefined |

### NewPrimaryDelegate

```solidity
event NewPrimaryDelegate(address indexed delegator, address indexed primaryDelegate)
```



*Emitted when an account denotes a primary delegate.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| delegator `indexed` | address | undefined |
| primaryDelegate `indexed` | address | undefined |

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

### UpdatedVotes

```solidity
event UpdatedVotes(address indexed voter, uint256 newVotes)
```



*Emitted when a token transfer or delegate change results in changes to an account&#39;s voting power.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| voter `indexed` | address | undefined |
| newVotes  | uint256 | undefined |



