# Eco Association

Copyright (c) 2023 Eco Association

## VotingPower

**VotingPower**

Compute voting power for user

### totalECOxSnapshot

ECOx voting power is snapshotted when the contract is cloned

```solidity
uint256 totalECOxSnapshot
```

### excludedVotingPower

voting power to exclude from totalVotingPower

```solidity
uint256 excludedVotingPower
```

### ecoToken

```solidity
contract ECO ecoToken
```

### ecoXStaking

the ECO contract address

```solidity
contract ECOxStaking ecoXStaking
```

### constructor

```solidity
constructor(contract Policy _policy, contract ECO _ecoAddr, contract ECOxStaking _ecoXStakingAddr) public
```

### totalVotingPower

```solidity
function totalVotingPower() public view returns (uint256)
```

### votingPower

```solidity
function votingPower(address _who, uint256 _snapshotBlock) public view returns (uint256)
```

