# Eco Association
Copyright (c) 2023 Eco Association

## VotingPower

### totalECOxSnapshot

```solidity
uint256 totalECOxSnapshot
```

### excludedVotingPower

```solidity
uint256 excludedVotingPower
```

### ecoToken

```solidity
contract ECO ecoToken
```

### constructor

```solidity
constructor(contract Policy _policy, contract ECO _ecoAddr) public
```

### totalVotingPower

```solidity
function totalVotingPower() public view returns (uint256)
```

### votingPower

```solidity
function votingPower(address _who, uint256 _snapshotBlock) public view returns (uint256)
```

### getXStaking

```solidity
function getXStaking() internal view returns (contract ECOxStaking)
```

