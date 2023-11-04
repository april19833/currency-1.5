# Eco Association

Copyright (c) 2023 Eco Association

## VoteCheckpoints

_Extension of ERC20 to support Compound-like voting and delegation. This version is more generic than Compound's,
and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1.

This extension keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
power can be queried through the public accessors {getVotingGons} and {getPastVotingGons}.

By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
will significantly increase the base gas cost of transfers.

_Available since v4.2.__

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

```solidity
mapping(address => address) _primaryDelegates
```

a mapping that tracks the primaryDelegates of each user

Primary delegates can only be chosen using delegate() which sends the full balance
The exist to maintain the functionality that recieving tokens gives those votes to the delegate

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

```solidity
event DelegatedVotes(address delegator, address delegatee, uint256 amount)
```

_Emitted when a delegatee is delegated new votes._

### UpdatedVotes

```solidity
event UpdatedVotes(address voter, uint256 newVotes)
```

_Emitted when a token transfer or delegate change results in changes to an account's voting power._

### NewPrimaryDelegate

```solidity
event NewPrimaryDelegate(address delegator, address primaryDelegate)
```

_Emitted when an account denotes a primary delegate._

### constructor

```solidity
constructor(string _name, string _symbol, address admin, address _initialPauser) internal
```

### totalSupplyAt

```solidity
function totalSupplyAt(uint256 _blockNumber) public view virtual returns (uint256)
```

Returns the total (inflation corrected) token supply at a specified block number

### getPastVotes

```solidity
function getPastVotes(address _owner, uint256 _blockNumber) public view virtual returns (uint256)
```

Return historical voting balance (includes delegation) at given block number.

If the latest block number for the account is before the requested
block then the most recent known balance is returned. Otherwise the
exact block number requested is returned.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | The account to check the balance of. |
| _blockNumber | uint256 | The block number to check the balance at the start                        of. Must be less than or equal to the present                        block number. |

### numCheckpoints

```solidity
function numCheckpoints(address account) public view virtual returns (uint32)
```

_Get number of checkpoints for `account`._

### enableDelegationTo

```solidity
function enableDelegationTo() public
```

_Set yourself as willing to recieve delegates._

### disableDelegationTo

```solidity
function disableDelegationTo() public
```

_Set yourself as no longer recieving delegates._

### reenableDelegating

```solidity
function reenableDelegating() public
```

_Set yourself as being able to delegate again.
also disables delegating to you
NOTE: the condition for this is not easy and cannot be unilaterally achieved_

### isOwnDelegate

```solidity
function isOwnDelegate(address account) public view returns (bool)
```

_Returns true if the user has no amount of their balance delegated, otherwise false._

### getPrimaryDelegate

```solidity
function getPrimaryDelegate(address account) public view virtual returns (address)
```

_Get the primary address `account` is currently delegating to. Defaults to the account address itself if none specified.
The primary delegate is the one that is delegated any new funds the address recieves._

### _setPrimaryDelegate

```solidity
function _setPrimaryDelegate(address delegator, address delegatee) internal
```

sets the primaryDelegate and emits an event to track it

### getVotingGons

```solidity
function getVotingGons(address account) public view returns (uint256)
```

_Gets the current votes balance in gons for `account`_

### getPastVotingGons

```solidity
function getPastVotingGons(address account, uint256 blockNumber) public view returns (uint256)
```

_Retrieve the number of votes in gons for `account` at the end of `blockNumber`.

Requirements:

- `blockNumber` must have been already mined_

### getPastTotalSupply

```solidity
function getPastTotalSupply(uint256 blockNumber) public view returns (uint256)
```

_Retrieve the `totalSupply` at the end of `blockNumber`. Note, this value is the sum of all balances.
It is NOT the sum of all the delegated votes!

Requirements:

- `blockNumber` must have been already mined_

### _checkpointsLookup

```solidity
function _checkpointsLookup(struct VoteCheckpoints.Checkpoint[] ckpts, uint256 blockNumber) internal view returns (uint256)
```

_Lookup a value in a list of (sorted) checkpoints._

### delegate

```solidity
function delegate(address delegatee) public
```

_Delegate all votes from the sender to `delegatee`.
NOTE: This function assumes that you do not have partial delegations
It will revert with "Must have an undelegated amount available to cover delegation" if you do_

### delegateBySig

```solidity
function delegateBySig(address delegator, address delegatee, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public
```

_Delegate all votes from the sender to `delegatee`.
NOTE: This function assumes that you do not have partial delegations
It will revert with "Must have an undelegated amount available to cover delegation" if you do_

### delegateAmount

```solidity
function delegateAmount(address delegatee, uint256 amount) public
```

_Delegate an `amount` of votes from the sender to `delegatee`._

### _delegate

```solidity
function _delegate(address delegator, address delegatee, uint256 amount) internal virtual
```

_Change delegation for `delegator` to `delegatee`.

Emits events {NewDelegatedAmount} and {UpdatedVotes}._

### undelegate

```solidity
function undelegate() public
```

_Undelegate all votes from the sender's primary delegate._

### undelegateFromAddress

```solidity
function undelegateFromAddress(address delegatee) public
```

_Undelegate votes from the `delegatee` back to the sender._

### _undelegateFromAddress

```solidity
function _undelegateFromAddress(address delegator, address delegatee) internal
```

_Undelegate votes from the `delegatee` back to the delegator._

### undelegateAmountFromAddress

```solidity
function undelegateAmountFromAddress(address delegatee, uint256 amount) public
```

_Undelegate a specific amount of votes from the `delegatee` back to the sender._

### _undelegate

```solidity
function _undelegate(address delegator, address delegatee, uint256 amount) internal virtual
```

### _maxSupply

```solidity
function _maxSupply() internal view virtual returns (uint224)
```

_Maximum token supply. Defaults to `type(uint224).max` (2^224^ - 1)._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual returns (uint256)
```

_Snapshots the totalSupply after it has been increased._

### _burn

```solidity
function _burn(address account, uint256 amount) internal virtual returns (uint256)
```

_Snapshots the totalSupply after it has been decreased._

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Move voting power when tokens are transferred.

Emits a {UpdatedVotes} event._

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

