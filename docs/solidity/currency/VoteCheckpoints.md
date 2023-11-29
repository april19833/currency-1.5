# Eco Association

Copyright (c) 2023 Eco Association

## VoteCheckpoints

Extension of ERC20 to support Compound-like voting and delegation. This version is more generic than Compound's,
and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1.

This extension keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
power can be queried through the public accessors {getVotingGons} and {getPastVotingGons}.

By default, token balance does not account for voting power. This makes transfers cheaper. the downside is that it
requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
will significantly increase the base gas cost of transfers.

_Available since v4.2._

### Checkpoint

```solidity
struct Checkpoint {
  uint32 fromBlock;
  uint224 value;
}
```

### _delegates

the mapping from an address to each address that it delegates to, then mapped to the amount delegated

  ```solidity
  mapping(address => mapping(address => uint256)) _delegates
  ```

### _delegatedTotals

a mapping that aggregates the total delegated amounts in the mapping above

  ```solidity
  mapping(address => uint256) _delegatedTotals
  ```

### _primaryDelegates

a mapping that tracks the primaryDelegates of each user

Primary delegates can only be chosen using delegate() which sends the full balance
the exist to maintain the functionality that recieving tokens gives those votes to the delegate

  ```solidity
  mapping(address => address) _primaryDelegates
  ```

### delegationToAddressEnabled

mapping that tracks if an address is willing to be delegated to

  ```solidity
  mapping(address => bool) delegationToAddressEnabled
  ```

### delegationFromAddressDisabled

mapping that tracks if an address is unable to delegate

  ```solidity
  mapping(address => bool) delegationFromAddressDisabled
  ```

### checkpoints

mapping to the ordered arrays of voting checkpoints for each address

  ```solidity
  mapping(address => struct VoteCheckpoints.Checkpoint[]) checkpoints
  ```

### DelegatedVotes

Emitted when a delegatee is delegated new votes.

  ```solidity
  event DelegatedVotes(address delegator, address delegatee, uint256 amount)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegator | address | the delegators address |
| delegatee | address | the delegatee address |
| amount | uint256 | the amount delegated |

### UpdatedVotes

Emitted when a token transfer or delegate change results in changes to an account's voting power.

  ```solidity
  event UpdatedVotes(address voter, uint256 newVotes)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| voter | address | the address of the voter |
| newVotes | uint256 | the new votes amount |

### NewPrimaryDelegate

Emitted when an account denotes a primary delegate.

  ```solidity
  event NewPrimaryDelegate(address delegator, address primaryDelegate)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegator | address | the delegator address |
| primaryDelegate | address | the primary delegates address |

### constructor

  ```solidity
  constructor(string _name, string _symbol, address admin, address _initialPauser) internal
  ```

### totalSupplyAt

Returns the total (inflation corrected) token supply at a specified block number

  ```solidity
  function totalSupplyAt(uint256 _blockNumber) public view virtual returns (uint256 pastTotalSupply)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _blockNumber | uint256 | the block number for retrieving the total supply |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| pastTotalSupply | uint256 | the total (inflation corrected) token supply at the specified block |

### getPastVotes

Return historical voting balance (includes delegation) at given block number.

If the latest block number for the account is before the requested
block then the most recent known balance is returned. Otherwise the
exact block number requested is returned.

  ```solidity
  function getPastVotes(address _owner, uint256 _blockNumber) public view virtual returns (uint256 pastVotingGons)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | the account to check the balance of. |
| _blockNumber | uint256 | the block number to check the balance at the start                        of. Must be less than or equal to the present                        block number. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| pastVotingGons | uint256 | historical voting balance (including delegation) at given block number |

### numCheckpoints

Get number of checkpoints for `account`.

  ```solidity
  function numCheckpoints(address account) public view virtual returns (uint32 checkPoints)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address of the account |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| checkPoints | uint32 | the number of checkpoints for the account |

### enableDelegationTo

Set yourself as willing to recieve delegates.

  ```solidity
  function enableDelegationTo() public
  ```

### disableDelegationTo

Set yourself as no longer recieving delegates.

  ```solidity
  function disableDelegationTo() public
  ```

### reenableDelegating

Set yourself as being able to delegate again.
also disables delegating to you
NOTE: the condition for this is not easy and cannot be unilaterally achieved

  ```solidity
  function reenableDelegating() public
  ```

### isOwnDelegate

Returns true if the user has no amount of their balance delegated, otherwise false.

  ```solidity
  function isOwnDelegate(address account) public view returns (bool noDelegation)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the account address to check for delegation |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| noDelegation | bool | true if the user has no amount of their balance delegated, otherwise false. |

### getPrimaryDelegate

Get the primary address `account` is currently delegating to. Defaults to the account address itself if none specified.
the primary delegate is the one that is delegated any new funds the address recieves.

  ```solidity
  function getPrimaryDelegate(address account) public view virtual returns (address primaryDelegate)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address of the account to check for primary delgate |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| primaryDelegate | address | the primary delegate for the account |

### _setPrimaryDelegate

sets the primaryDelegate and emits an event to track it

  ```solidity
  function _setPrimaryDelegate(address delegator, address delegatee) internal
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegator | address | the address of the delegator |
| delegatee | address | the address of the delegatee |

### getVotingGons

Gets the current votes balance in gons for `account`

  ```solidity
  function getVotingGons(address account) public view returns (uint256 votingGons)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address of the account |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| votingGons | uint256 | the current votes balance in gons for the acccount |

### getPastVotingGons

Retrieve the number of votes in gons for `account` at the end of `blockNumber`.

Requirements:

- `blockNumber` must have been already mined

  ```solidity
  function getPastVotingGons(address account, uint256 blockNumber) public view returns (uint256 pastVotingGons)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address of the account to get the votes for |
| blockNumber | uint256 | the blockNumber to get the votes for |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| pastVotingGons | uint256 | the number of votes in gons for the account and block number |

### getPastTotalSupply

Retrieve the `totalSupply` at the end of `blockNumber`. Note, this value is the sum of all balances.
It is NOT the sum of all the delegated votes!

Requirements:

- `blockNumber` must have been already mined

  ```solidity
  function getPastTotalSupply(uint256 blockNumber) public view returns (uint256 pastTotalSupply)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| blockNumber | uint256 | the block number to get the past total supply |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| pastTotalSupply | uint256 | the totalSupply at the end of blockNumber calculated by summing all balances. |

### _checkpointsLookup

Lookup a value in a list of (sorted) checkpoints.

This function runs a binary search to look for the last checkpoint taken before `blockNumber`.

During the loop, the index of the wanted checkpoint remains in the range [low-1, high).
With each iteration, either `low` or `high` is moved towards the middle of the range to maintain the invariant.

- If the middle checkpoint is after `blockNumber`, the next iteration looks in [low, mid)
- If the middle checkpoint is before or equal to `blockNumber`, the next iteration looks in [mid+1, high)

Once it reaches a single value (when low == high), it has found the right checkpoint at the index high-1, if not
out of bounds (in which case it's looking too far in the past and the result is 0).
Note that if the latest checkpoint available is exactly for `blockNumber`, it will end up with an index that is
past the end of the array, so this technically doesn't find a checkpoint after `blockNumber`, but the result is
the same.

  ```solidity
  function _checkpointsLookup(struct VoteCheckpoints.Checkpoint[] ckpts, uint256 blockNumber) internal view returns (uint256 checkPoint)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| ckpts | struct VoteCheckpoints.Checkpoint[] | list of sorted checkpoints |
| blockNumber | uint256 | the blockNumber to seerch for the last checkpoint taken before |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| checkPoint | uint256 | the checkpoint |

### delegate

Delegate all votes from the sender to `delegatee`.
NOTE: This function assumes that you do not have partial delegations
It will revert with "Must have an undelegated amount available to cover delegation" if you do

  ```solidity
  function delegate(address delegatee) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the address of the delegatee |

### delegateBySig

Delegate all votes from the sender to `delegatee`.
NOTE: This function assumes that you do not have partial delegations
It will revert with "Must have an undelegated amount available to cover delegation" if you do

  ```solidity
  function delegateBySig(address delegator, address delegatee, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public
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

### delegateAmount

Delegate an `amount` of votes from the sender to `delegatee`.

  ```solidity
  function delegateAmount(address delegatee, uint256 amount) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | The address being delegated to |
| amount | uint256 | The amount of votes |

### _delegate

Change delegation for `delegator` to `delegatee`.

Emits events {NewDelegatedAmount} and {UpdatedVotes}.

  ```solidity
  function _delegate(address delegator, address delegatee, uint256 amount) internal virtual
  ```

### undelegate

Undelegate all votes from the sender's primary delegate.

  ```solidity
  function undelegate() public
  ```

### undelegateFromAddress

Undelegate votes from the `delegatee` back to the sender.

  ```solidity
  function undelegateFromAddress(address delegatee) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the delegatee address |

### _undelegateFromAddress

Undelegate votes from the `delegatee` back to the delegator.

  ```solidity
  function _undelegateFromAddress(address delegator, address delegatee) internal
  ```

### undelegateAmountFromAddress

Undelegate a specific amount of votes from the `delegatee` back to the sender.

  ```solidity
  function undelegateAmountFromAddress(address delegatee, uint256 amount) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | The address being delegated to |
| amount | uint256 | The amount of votes |

### _undelegate

  ```solidity
  function _undelegate(address delegator, address delegatee, uint256 amount) internal virtual
  ```

### _maxSupply

Maximum token supply. Defaults to `type(uint224).max` (2^224^ - 1).

  ```solidity
  function _maxSupply() internal view virtual returns (uint224)
  ```

### _mint

Snapshots the totalSupply after it has been increased.

  ```solidity
  function _mint(address account, uint256 amount) internal virtual returns (uint256)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the account to mint from |
| amount | uint256 | the amount to mint |

### _burn

Snapshots the totalSupply after it has been decreased.

  ```solidity
  function _burn(address account, uint256 amount) internal virtual returns (uint256)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the account to burn from |
| amount | uint256 | the amount to burn |

### _afterTokenTransfer

Move voting power when tokens are transferred.

Emits a {UpdatedVotes} event.

  ```solidity
  function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | the transfer from address |
| to | address | the transfer to address |
| amount | uint256 | the amount transferred |

### _writeCheckpoint

returns the newly written value in the checkpoint

  ```solidity
  function _writeCheckpoint(struct VoteCheckpoints.Checkpoint[] ckpts, function (uint256,uint256) view returns (uint256) op, uint256 delta) internal returns (uint256)
  ```

### _add

  ```solidity
  function _add(uint256 a, uint256 b) internal pure returns (uint256)
  ```

### _subtract

  ```solidity
  function _subtract(uint256 a, uint256 b) internal pure returns (uint256)
  ```

### _replace

  ```solidity
  function _replace(uint256, uint256 b) internal pure returns (uint256)
  ```

