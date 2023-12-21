# Eco Association

Copyright (c) 2023 Eco Association

## VotingPower

**VotingPower**

Compute voting power for user

### ecoToken

```solidity
contract ECO ecoToken
```

### ecoXStaking

```solidity
contract ECOxStaking ecoXStaking
```

### snapshotBlock

snapshot block for calculating voting power

```solidity
uint256 snapshotBlock
```

### constructor

```solidity
constructor(contract Policy _policy, contract ECO _ecoAddr, contract ECOxStaking _ecoXStakingAddr) public
```

### totalVotingPower

Calculates the total Voting Power by getting the total supply of ECO
and adding total ECOX (multiplied by 10) and subtracting the excluded Voting Power

```solidity
function totalVotingPower() public view returns (uint256 total)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| total | uint256 | the total Voting Power |

### votingPower

Calculates the voting power for an address at a specifc block

```solidity
function votingPower(address _who) public view returns (uint256 total)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _who | address | the address to calculate the voting power for |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| total | uint256 | the total vorting power for an address at the Snapshot Block |

