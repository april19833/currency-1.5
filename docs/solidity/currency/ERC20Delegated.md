# Eco Association

Copyright (c) 2023 Eco Association

## ERC20Delegated

This contract tracks delegations of an ERC20 token by tokenizing the delegations
It assumes a companion token that is transferred to denote changes in votes brought
on by both transfers (via _afterTokenTransfer hooks) and delegations.
The secondary token creates allowances whenever it delegates to allow for reclaiming the voting power later

Voting power can be queried through the public accessor {voteBalanceOf}. Vote power can be delegated either
by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}.
Delegates need to disable their own ability to delegate to enable others to delegate to them.

Raw delegations can be done in partial amounts via {delegateAmount}. This is intended for contracts which can run
their own internal ledger of delegations and will prevent you from transferring the delegated funds until you undelegate.

### voter

```solidity
mapping(address => bool) voter
```

### _voteBalances

```solidity
mapping(address => uint256) _voteBalances
```

### _primaryDelegates

a mapping that tracks the primaryDelegates of each user

Primary delegates can only be chosen using delegate() which sends the full balance
The exist to maintain the functionality that recieving tokens gives those votes to the delegate

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

### DelegatedVotes

Emitted when a delegatee is delegated new votes.

```solidity
event DelegatedVotes(address delegator, address delegatee, uint256 amount)
```

### VoteTransfer

Emitted when a token transfer or delegate change results a transfer of voting power.

```solidity
event VoteTransfer(address sendingVoter, address recievingVoter, uint256 votes)
```

### NewPrimaryDelegate

Emitted when an account denotes a primary delegate.

```solidity
event NewPrimaryDelegate(address delegator, address primaryDelegate)
```

### constructor

```solidity
constructor(contract Policy _policy, string _name, string _symbol, address _initialPauser) internal
```

### enableVoting

```solidity
function enableVoting() public
```

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

```solidity
function reenableDelegating() public
```

### isOwnDelegate

Returns true if the user has no amount of their balance delegated, otherwise false.

```solidity
function isOwnDelegate(address account) public view returns (bool)
```

### getPrimaryDelegate

Get the primary address `account` is currently delegating to. Defaults to the account address itself if none specified.
The primary delegate is the one that is delegated any new funds the address recieves.

```solidity
function getPrimaryDelegate(address account) public view virtual returns (address)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address whose primary delegate is being fetched |

### _setPrimaryDelegate

sets the primaryDelegate and emits an event to track it

```solidity
function _setPrimaryDelegate(address delegator, address delegatee) internal
```

### delegate

Delegate all votes from the sender to `delegatee`.
NOTE: This function assumes that you do not have partial delegations
It will revert with "ERC20Delegated: must have an undelegated amount available to cover delegation" if you do

```solidity
function delegate(address delegatee) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | the address being delegated to |

### delegateBySig

Delegate all votes from the sender to `delegatee`.
NOTE: This function assumes that you do not have partial delegations
It will revert with "ERC20Delegated: must have an undelegated amount available to cover delegation" if you do

```solidity
function delegateBySig(address delegator, address delegatee, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegator | address | the address delegating votes |
| delegatee | address | the address being delegated to |
| deadline | uint256 | the time at which the signature expires |
| v | uint8 | signature value |
| r | bytes32 | signature value |
| s | bytes32 | signature value |

### delegateAmount

Delegate an `amount` of votes from the sender to `delegatee`.

```solidity
function delegateAmount(address delegatee, uint256 amount) public
```

### _delegate

Change delegation for `delegator` to `delegatee`.

Emits events {NewDelegatedAmount} and {VoteTransfer}.

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

### revokeDelegation

A primary delegated individual can revoke delegations of unwanted delegators
Useful for allowing yourself to call reenableDelegating after calling disableDelegationTo

```solidity
function revokeDelegation(address delegator) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegator | address | the address whose delegation is being revoked |

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
| delegatee | address | the address being undelegated to |
| amount | uint256 | the amount of tokens being undelegated |

### _undelegate

```solidity
function _undelegate(address delegator, address delegatee, uint256 amount) internal virtual
```

### _afterTokenTransfer

Move voting power when tokens are transferred.

Emits a {VoteTransfer} event.

```solidity
function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
```

### voteBalanceOf

See {IERC20-balanceOf}.

```solidity
function voteBalanceOf(address account) public view virtual returns (uint256)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address whose vote balance is being checked |

### voteTransfer

See {IERC20-transfer}.

Requirements:

- `recipient` cannot be the zero address.
- the caller must have a balance of at least `amount`.

```solidity
function voteTransfer(address recipient, uint256 amount) internal virtual returns (bool)
```

### voteAllowance

See {IERC20-allowance}.

```solidity
function voteAllowance(address owner, address spender) internal view virtual returns (uint256)
```

### voteApprove

See {IERC20-approve}.

Requirements:

- `spender` cannot be the zero address.

```solidity
function voteApprove(address spender, uint256 amount) internal virtual returns (bool)
```

### _voteTransferFrom

not the same as ERC20 transferFrom
is instead more restrictive, only allows for transfers where the recipient owns the allowance

```solidity
function _voteTransferFrom(address sender, address recipient, uint256 amount) internal virtual returns (bool)
```

### _voteTransfer

Moves `amount` of tokens from `sender` to `recipient`.

This internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `sender` cannot be the zero address.
- `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.

```solidity
function _voteTransfer(address sender, address recipient, uint256 amount) internal virtual
```

### _voteMint

Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements:

- `account` cannot be the zero address.

```solidity
function _voteMint(address account, uint256 amount) internal virtual returns (uint256)
```

### _voteBurn

Destroys `amount` tokens from `account`, reducing the
total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements:

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens.

```solidity
function _voteBurn(address account, uint256 amount) internal virtual returns (uint256)
```

### _voteApprove

Sets `amount` as the allowance of `spender` over the `owner` s tokens.

This internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- `owner` cannot be the zero address.
- `spender` cannot be the zero address.

```solidity
function _voteApprove(address owner, address spender, uint256 amount) internal virtual
```

### _increaseVoteAllowance

Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.

```solidity
function _increaseVoteAllowance(address owner, address spender, uint256 addedValue) internal virtual returns (bool)
```

### _decreaseVoteAllowance

Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`.

```solidity
function _decreaseVoteAllowance(address owner, address spender, uint256 subtractedValue) internal virtual returns (bool)
```

### _beforeVoteTokenTransfer

Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
will be transferred to `to`.
- when `from` is zero, `amount` tokens will be minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens will be burned.
- `from` and `to` are never both zero.

```solidity
function _beforeVoteTokenTransfer(address, address, uint256 amount) internal virtual
```

### _afterVoteTokenTransfer

Hook that is called after any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
has been transferred to `to`.
- when `from` is zero, `amount` tokens have been minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens have been burned.
- `from` and `to` are never both zero.

```solidity
function _afterVoteTokenTransfer(address, address, uint256 amount) internal virtual
```

