# Eco Association

Copyright (c) 2023 Eco Association

## Rebase

### eco

```solidity
contract ECO eco
```

### INFLATION_FLOOR

```solidity
uint256 INFLATION_FLOOR
```

### INFLATION_CEILING

```solidity
uint256 INFLATION_CEILING
```

### BadInflationMultiplier

```solidity
error BadInflationMultiplier(uint256 rate)
```

### Rebased

```solidity
event Rebased(uint256 newInflation)
```

### constructor

```solidity
constructor(contract Policy policy, contract ECO _eco) public
```

### execute

```solidity
function execute(uint256 _newMultiplier) public
```

