# Eco Association

Copyright (c) 2023 Eco Association

## Rebase

**Rebase lever**

This contract is a monetary policy lever that rebases the eco currency in accordance with
the decision made by the slate of trustees.

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

