# Eco Association

Copyright (c) 2023 Eco Association

## ForwardTarget

**Target for ForwardProxy and EcoInitializable**

### onlyConstruction

  ```solidity
  modifier onlyConstruction()
  ```

### constructor

  ```solidity
  constructor() internal
  ```

### initialize

Storage initialization of cloned contract

This is used to initialize the storage of the forwarded contract, and
should (typically) copy or repeat any work that would normally be
done in the constructor of the proxied contract.

Implementations of ForwardTarget should override this function,
and chain to super.initialize(_self).

  ```solidity
  function initialize(address _self) public virtual
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | The address of the original contract instance (the one being              forwarded to). |

### implementation

Get the address of the proxy target contract.

  ```solidity
  function implementation() public view returns (address _impl)
  ```

### setImplementation

Set new implementation

  ```solidity
  function setImplementation(address _impl) internal
  ```

