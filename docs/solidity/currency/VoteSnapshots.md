# Eco Association

Copyright (c) 2023 Eco Association

## VoteSnapshots

Extension of ERC20Delegated to support snapshotting.

This extension maintains a snapshot of each addresses's votes which updates on the transfer after a new snapshot is taken.
Only addresses that have opted into voting are snapshotted.

### constructor

Construct a new instance.

the root _policy needs to be passed down through to service ERC20BurnAndMint

```solidity
constructor(contract Policy _policy, string _name, string _symbol, address _initialPauser) internal
```

### voteBalanceSnapshot

Retrieve the balance for the snapshot

```solidity
function voteBalanceSnapshot(address account) public view virtual returns (uint256 balance)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address to check vote balances for |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| balance | uint256 | the balance for the snapshot |

### _beforeVoteTokenTransfer

Update balance snapshots for votes before the values are modified. This is implemented
in the _beforeVoteTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.

```solidity
function _beforeVoteTokenTransfer(address from, address to, uint256 amount) internal virtual
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | the from address for the transfer |
| to | address | the to address for the transfer |
| amount | uint256 | the amount of the transfer |

