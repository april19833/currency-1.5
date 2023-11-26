# Eco Association

Copyright (c) 2023 Eco Association

## ERC20Pausable

  _Implementation of the {IERC20} interface with pausability
When paused by the pauser admin, transfers revert._

### roleAdmin

  ```solidity
  address roleAdmin
  ```

### pauser

  ```solidity
  address pauser
  ```

### PauserAssignment

  ```solidity
  event PauserAssignment(address pauser)
  ```

event indicating the pauser was updated

  ####
  Parameters | Name | Type | Description | | ---- | ---- | ----------- |
    |
    pauser
    |
    address
    |
    The new pauser
    |

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

  ```solidity
  function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual returns (uint256)
  ```

  _Hook that is called before any transfer of tokens. This includes
minting and burning.

If the token is not paused, it will pass through the amount_

### pause

  ```solidity
  function pause() external
  ```

pauses transfers of this token

  _only callable by the pauser_

### unpause

  ```solidity
  function unpause() external
  ```

unpauses transfers of this token

  _only callable by the pauser_

### setPauser

  ```solidity
  function setPauser(address _pauser) public
  ```

set the given address as the pauser

  _only the roleAdmin can call this function_

  ####
  Parameters | Name | Type | Description | | ---- | ---- | ----------- |
    |
    _pauser
    |
    address
    |
    The address that can pause this token
    |

