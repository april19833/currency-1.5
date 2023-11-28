# Eco Association

Copyright (c) 2023 Eco Association

## ECOx

**An ERC20 token interface for ECOx**

### ecoXExchange

_address of ECOxExchange contract_

  ```solidity
  address ecoXExchange
  ```

### TransferFailed

_error for when transfer returns false
used by contracts that import this contract_

  ```solidity
  error TransferFailed()
  ```

### UpdatedECOxExchange

_emits when the ECOxExchange address is changed_

  ```solidity
  event UpdatedECOxExchange(address _old, address _new)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _old | address | old holder of role |
| _new | address | new holder of role |

### constructor

_Constructor_

  ```solidity
  constructor(contract Policy _policy, address _pauser) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | The policy contract that oversees other contracts |
| _pauser | address | The address of the Pauser |

### initialize

_unlikely this will need to be used again since the proxy has already been initialized._

  ```solidity
  function initialize(address _self) public virtual
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | the address to initialize |

### updateECOxExchange

_change the ECOxExchange address_

  ```solidity
  function updateECOxExchange(address _newRoleHolder) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newRoleHolder | address | the new ECOxExchange address |

