# Eco Association
Copyright (c) 2023 Eco Association

## CommunityGovernance

### eco

```solidity
contract ECO eco
```

ECO contract

### ecoXStaking

```solidity
contract ECOxStaking ecoXStaking
```

ECOxStaking contract

### pauser

```solidity
address pauser
```

address allowed to pause community governance

### OnlyPauser

```solidity
error OnlyPauser()
```

error for when non-pauser tries to call methods without permission

### SamePauser

```solidity
error SamePauser()
```

error for when setPauser is called with the existing pauser address as an argument

### PauserAssignment

```solidity
event PauserAssignment(address pauser)
```

event indicating the pauser was updated

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pauser | address | The new pauser |

### onlyPauser

```solidity
modifier onlyPauser()
```

### constructor

```solidity
constructor(contract Policy policy, address _eco, address _ecoXStaking, address _pauser) public
```

### setPauser

```solidity
function setPauser(address _pauser) public
```

