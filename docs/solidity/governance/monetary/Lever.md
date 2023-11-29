# Eco Association

Copyright (c) 2023 Eco Association

## Lever

**Monetary policy lever**

This contract is a generic monetary policy lever and is inherited by all lever implementations.

### authorized

  ```solidity
  mapping(address => bool) authorized
  ```

### notifier

  ```solidity
  contract Notifier notifier
  ```

### AuthorizedOnly

  ```solidity
  error AuthorizedOnly()
  ```

### AuthorizationChanged

  ```solidity
  event AuthorizationChanged(address agent, bool status)
  ```

### NotifierChanged

  ```solidity
  event NotifierChanged(contract Notifier oldNotifier, contract Notifier newNotifier)
  ```

### onlyAuthorized

  ```solidity
  modifier onlyAuthorized()
  ```

### constructor

  ```solidity
  constructor(contract Policy _policy) public
  ```

### setAuthorized

Changes the authorized status of an address.

  ```solidity
  function setAuthorized(address _agent, bool _status) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _agent | address | The address whose status is changing |
| _status | bool | The new status of _agent |

### setNotifier

Changes the notifier for the lever.

  ```solidity
  function setNotifier(contract Notifier _notifier) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _notifier | contract Notifier | The new notifier address |

