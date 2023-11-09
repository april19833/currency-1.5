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

### DelegatedVotes

```solidity
event DelegatedVotes(address delegator, address delegatee, uint256 amount)
```

_Emitted when a delegatee is delegated new votes._

### VoteTransfer

```solidity
event VoteTransfer(address sendingVoter, address recievingVoter, uint256 votes)
```

_Emitted when a token transfer or delegate change results a transfer of voting power._

### NewPrimaryDelegate

```solidity
event NewPrimaryDelegate(address delegator, address primaryDelegate)
```

_Emitted when an account denotes a primary delegate._

### constructor

```solidity
constructor(contract Policy _policy, string _name, string _symbol, address _initialPauser) internal
```

### enableVoting

```solidity
function enableVoting() public
```

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
also disables delegating to you_

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

### delegate

```solidity
function delegate(address delegatee) public
```

_Delegate all votes from the sender to `delegatee`.
NOTE: This function assumes that you do not have partial delegations
It will revert with "ERC20Delegated: must have an undelegated amount available to cover delegation" if you do_

### delegateBySig

```solidity
function delegateBySig(address delegator, address delegatee, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public
```

_Delegate all votes from the sender to `delegatee`.
NOTE: This function assumes that you do not have partial delegations
It will revert with "ERC20Delegated: must have an undelegated amount available to cover delegation" if you do_

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

Emits events {NewDelegatedAmount} and {VoteTransfer}._

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

### revokeDelegation

```solidity
function revokeDelegation(address delegator) public
```

A primary delegated individual can revoke delegations of unwanted delegators
Useful for allowing yourself to call reenableDelegating after calling disableDelegationTo

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

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Move voting power when tokens are transferred.

Emits a {VoteTransfer} event._

### voteBalanceOf

```solidity
function voteBalanceOf(address account) public view virtual returns (uint256)
```

_See {IERC20-balanceOf}._

### voteTransfer

```solidity
function voteTransfer(address recipient, uint256 amount) internal virtual returns (bool)
```

_See {IERC20-transfer}.

Requirements:

- `recipient` cannot be the zero address.
- the caller must have a balance of at least `amount`._

### voteAllowance

```solidity
function voteAllowance(address owner, address spender) internal view virtual returns (uint256)
```

_See {IERC20-allowance}._

### voteApprove

```solidity
function voteApprove(address spender, uint256 amount) internal virtual returns (bool)
```

_See {IERC20-approve}.

Requirements:

- `spender` cannot be the zero address._

### _voteTransferFrom

```solidity
function _voteTransferFrom(address sender, address recipient, uint256 amount) internal virtual returns (bool)
```

not the same as ERC20 transferFrom
is instead more restrictive, only allows for transfers where the recipient owns the allowance

### _voteTransfer

```solidity
function _voteTransfer(address sender, address recipient, uint256 amount) internal virtual
```

_Moves `amount` of tokens from `sender` to `recipient`.

This internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `sender` cannot be the zero address.
- `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`._

### _voteMint

```solidity
function _voteMint(address account, uint256 amount) internal virtual returns (uint256)
```

_Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements:

- `account` cannot be the zero address._

### _voteBurn

```solidity
function _voteBurn(address account, uint256 amount) internal virtual returns (uint256)
```

_Destroys `amount` tokens from `account`, reducing the
total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements:

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens._

### _voteApprove

```solidity
function _voteApprove(address owner, address spender, uint256 amount) internal virtual
```

_Sets `amount` as the allowance of `spender` over the `owner` s tokens.

This internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- `owner` cannot be the zero address.
- `spender` cannot be the zero address._

### _increaseVoteAllowance

```solidity
function _increaseVoteAllowance(address owner, address spender, uint256 addedValue) internal virtual returns (bool)
```

_Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address._

### _decreaseVoteAllowance

```solidity
function _decreaseVoteAllowance(address owner, address spender, uint256 subtractedValue) internal virtual returns (bool)
```

_Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`._

### _beforeVoteTokenTransfer

```solidity
function _beforeVoteTokenTransfer(address, address, uint256 amount) internal virtual
```

_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
will be transferred to `to`.
- when `from` is zero, `amount` tokens will be minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens will be burned.
- `from` and `to` are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _afterVoteTokenTransfer

```solidity
function _afterVoteTokenTransfer(address, address, uint256 amount) internal virtual
```

_Hook that is called after any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
has been transferred to `to`.
- when `from` is zero, `amount` tokens have been minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens have been burned.
- `from` and `to` are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

