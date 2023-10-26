# Eco Association
Copyright (c) 2023 Eco Association

## ForwardTarget

### onlyConstruction

```solidity
modifier onlyConstruction()
```

### constructor

```solidity
constructor() internal
```

### initialize

```solidity
function initialize(address _self) public virtual
```

Storage initialization of cloned contract

This is used to initialize the storage of the forwarded contract, and
should (typically) copy or repeat any work that would normally be
done in the constructor of the proxied contract.

Implementations of ForwardTarget should override this function,
and chain to super.initialize(_self).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | The address of the original contract instance (the one being              forwarded to). |

### implementation

```solidity
function implementation() public view returns (address _impl)
```

Get the address of the proxy target contract.

### setImplementation

```solidity
function setImplementation(address _impl) internal
```

Set new implementation

