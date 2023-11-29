# Eco Association

Copyright (c) 2023 Eco Association

## ERC20Pausable

Implementation of the {IERC20} interface with pausability
When paused by the pauser admin, transfers revert.

### roleAdmin

  ```solidity
  address roleAdmin
  ```

### pauser

  ```solidity
  address pauser
  ```

### PauserAssignment

event indicating the pauser was updated

  ```solidity
  event PauserAssignment(address pauser)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pauser | address | The new pauser |

### constructor

  ```solidity
  constructor(string name, string symbol, address _roleAdmin, address _initialPauser) public
  ```

### onlyAdmin

  ```solidity
  modifier onlyAdmin()
  ```

### onlyPauser

  ```solidity
  modifier onlyPauser()
  ```

### _beforeTokenTransfer

Hook that is called before any transfer of tokens. This includes
minting and burning.

If the token is not paused, it will pass through the amount

  ```solidity
  function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual returns (uint256)
  ```

### pause

pauses transfers of this token
only callable by the pauser

  ```solidity
  function pause() external
  ```

### unpause

unpauses transfers of this token
only callable by the pauser

  ```solidity
  function unpause() external
  ```

### setPauser

set the given address as the pauser

  ```solidity
  function setPauser(address _pauser) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pauser | address | The address that can pause this token only the roleAdmin can call this function |

