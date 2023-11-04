# Eco Association

Copyright (c) 2023 Eco Association

## DummyLever

contract to be a placeholder for a monetary policy lever in tests

### executeMarker

```solidity
uint256 executeMarker
```

### executeFunctionSignature

```solidity
bytes4 executeFunctionSignature
```

### alwaysPassFunctionSignature

```solidity
bytes4 alwaysPassFunctionSignature
```

### datalessPasserFunctionSignature

```solidity
bytes4 datalessPasserFunctionSignature
```

### alwaysRevertFunctionSignature

```solidity
bytes4 alwaysRevertFunctionSignature
```

### veryExpensiveFunctionSignature

```solidity
bytes4 veryExpensiveFunctionSignature
```

### ExecuteData

```solidity
event ExecuteData(uint256 number, address account, bytes32 data)
```

### constructor

```solidity
constructor() public
```

### execute

```solidity
function execute(uint256 number, address account, bytes32 data) external
```

### alwaysPass

```solidity
function alwaysPass(bytes32 data) external
```

### datalessPasser

```solidity
function datalessPasser() external
```

### alwaysRevert

```solidity
function alwaysRevert(bytes32 data) external
```

### veryExpensiveFunction

```solidity
function veryExpensiveFunction() external
```

### fallback

```solidity
fallback(bytes data) external payable returns (bytes)
```

