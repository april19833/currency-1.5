# Eco Association

Copyright (c) 2023 Eco Association

## VoteCheckpoints

_Extension of ERC20 to support Compound-like voting and delegation. This version is more generic than Compound's,
and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1.

This extension keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
power can be queried through the public accessors {getVotingGons} and {getPastVotingGons}.

By default, token balance does not account for voting power. This makes transfers cheaper. the downside is that it
requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
will significantly increase the base gas cost of transfers.

Available since v4.2._

### Checkpoint

```solidity
struct Checkpoint {
  uint32 fromBlock;
  uint224 value;
}
```

### _delegates

  ```solidity
  mapping(address => mapping(address => uint256)) _delegates
  ```

### _delegatedTotals

  ```solidity
  mapping(address => uint256) _delegatedTotals
  ```

### _primaryDelegates

_a mapping that tracks the primaryDelegates of each user

Primary delegates can only be chosen using delegate() which sends the full balance
the exist to maintain the functionality that recieving tokens gives those votes to the delegate_

  ```solidity
  mapping(address => address) _primaryDelegates
  ```

### delegationToAddressEnabled

  ```solidity
  mapping(address => bool) delegationToAddressEnabled
  ```

### delegationFromAddressDisabled

  ```solidity
  mapping(address => bool) delegationFromAddressDisabled
  ```

### checkpoints

  ```solidity
  mapping(address => struct VoteCheckpoints.Checkpoint[]) checkpoints
  ```

### DelegatedVotes

_Emitted when a delegatee is delegated new votes._

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

_Emitted when a token transfer or delegate change results in changes to an account's voting power._

  ```solidity
  event UpdatedVotes(address voter, uint256 newVotes)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| voter | address | the address of the voter |
| newVotes | uint256 | the new votes amount |

### NewPrimaryDelegate

_Emitted when an account denotes a primary delegate._

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
  function totalSupplyAt(uint256 _blockNumber) public view virtual returns (uint256)
  ```

### getPastVotes

_Return historical voting balance (includes delegation) at given block number.

If the latest block number for the account is before the requested
block then the most recent known balance is returned. Otherwise the
exact block number requested is returned._

  ```solidity
  function getPastVotes(address _owner, uint256 _blockNumber) public view virtual returns (uint256)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | the account to check the balance of. |
| _blockNumber | uint256 | the block number to check the balance at the start                        of. Must be less than or equal to the present                        block number. |

### numCheckpoints

_Get number of checkpoints for `account`._

  ```solidity
  function numCheckpoints(address account) public view virtual returns (uint32)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address of the account |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | number of checkppints for the account |

### enableDelegationTo

_Set yourself as willing to recieve delegates._

  ```solidity
  function enableDelegationTo() public
  ```

### disableDelegationTo

_Set yourself as no longer recieving delegates._

  ```solidity
  function disableDelegationTo() public
  ```

### reenableDelegating

_Set yourself as being able to delegate again.
also disables delegating to you
NOTE: the condition for this is not easy and cannot be unilaterally achieved_

  ```solidity
  function reenableDelegating() public
  ```

### isOwnDelegate

_Returns true if the user has no amount of their balance delegated, otherwise false._

  ```solidity
  function isOwnDelegate(address account) public view returns (bool)
  ```

### getPrimaryDelegate

_Get the primary address `account` is currently delegating to. Defaults to the account address itself if none specified.
the primary delegate is the one that is delegated any new funds the address recieves._

  ```solidity
  function getPrimaryDelegate(address account) public view virtual returns (address)
  ```

### _setPrimaryDelegate

_sets the primaryDelegate and emits an event to track it_

  ```solidity
  function _setPrimaryDelegate(address delegator, address delegatee) internal
  ```

### getVotingGons

_Gets the current votes balance in gons for `account`_

  ```solidity
  function getVotingGons(address account) public view returns (uint256)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address of the account |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the curren votes balance in gons for the acccount |

### getPastVotingGons

_Retrieve the number of votes in gons for `account` at the end of `blockNumber`.

Requirements:

- `blockNumber` must have been already mined_

  ```solidity
  function getPastVotingGons(address account, uint256 blockNumber) public view returns (uint256)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address of the account to get the votes for |
| blockNumber | uint256 | the blockNumber to get the votes for |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the number of votes in gons for the account and block number |

### getPastTotalSupply

_Retrieve the `totalSupply` at the end of `blockNumber`. Note, this value is the sum of all balances.
It is NOT the sum of all the delegated votes!

Requirements:

- `blockNumber` must have been already mined_

  ```solidity
  function getPastTotalSupply(uint256 blockNumber) public view returns (uint256)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| blockNumber | uint256 | the block number to get the past total supply |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the totalSupply at the end of blockNumber calculated by summing all balances. |

### _checkpointsLookup

_Lookup a value in a list of (sorted) checkpoints._

  ```solidity
  function _checkpointsLookup(struct VoteCheckpoints.Checkpoint[] ckpts, uint256 blockNumber) internal view returns (uint256)
  ```

### delegate

_Delegate all votes from the sender to `delegatee`.
NOTE: This function assumes that you do not have partial delegations
It will revert with "Must have an undelegated amount available to cover delegation" if you do_

  ```solidity
  function delegate(address delegatee) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the address of the delegatee |

### delegateBySig

_Delegate all votes from the sender to `delegatee`.
NOTE: This function assumes that you do not have partial delegations
It will revert with "Must have an undelegated amount available to cover delegation" if you do_

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

_Delegate an `amount` of votes from the sender to `delegatee`._

  ```solidity
  function delegateAmount(address delegatee, uint256 amount) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | The address being delegated to |
| amount | uint256 | The amount of votes |

### _delegate

_Change delegation for `delegator` to `delegatee`.

Emits events {NewDelegatedAmount} and {UpdatedVotes}._

  ```solidity
  function _delegate(address delegator, address delegatee, uint256 amount) internal virtual
  ```

### undelegate

_Undelegate all votes from the sender's primary delegate._

  ```solidity
  function undelegate() public
  ```

### undelegateFromAddress

_Undelegate votes from the `delegatee` back to the sender._

  ```solidity
  function undelegateFromAddress(address delegatee) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the delegatee address |

### _undelegateFromAddress

_Undelegate votes from the `delegatee` back to the delegator._

  ```solidity
  function _undelegateFromAddress(address delegator, address delegatee) internal
  ```

### undelegateAmountFromAddress

_Undelegate a specific amount of votes from the `delegatee` back to the sender._

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

_Maximum token supply. Defaults to `type(uint224).max` (2^224^ - 1)._

  ```solidity
  function _maxSupply() internal view virtual returns (uint224)
  ```

### _mint

_Snapshots the totalSupply after it has been increased._

  ```solidity
  function _mint(address account, uint256 amount) internal virtual returns (uint256)
  ```

### _burn

_Snapshots the totalSupply after it has been decreased._

  ```solidity
  function _burn(address account, uint256 amount) internal virtual returns (uint256)
  ```

### _afterTokenTransfer

_Move voting power when tokens are transferred.

Emits a {UpdatedVotes} event._

  ```solidity
  function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
  ```

### _writeCheckpoint

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

