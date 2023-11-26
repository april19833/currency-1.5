# Eco Association

Copyright (c) 2023 Eco Association

## ECOx

**An ERC20 token interface for ECOx**

### ecoXExchange

  ```solidity
  address ecoXExchange
  ```

_address of ECOxExchange contract_

### TransferFailed

  ```solidity
  error TransferFailed()
  ```

_error for when transfer returns false
used by contracts that import this contract_

### UpdatedECOxExchange

  ```solidity
  event UpdatedECOxExchange(address _old, address _new)
  ```

_emits when the ECOxExchange address is changed_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _old | address | old holder of role |
| _new | address | new holder of role |

### constructor

  ```solidity
  constructor(contract Policy _policy, address _pauser) public
  ```

_Constructor_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | The policy contract that oversees other contracts |
| _pauser | address | The address of the Pauser |

### initialize

  ```solidity
  function initialize(address _self) public virtual
  ```

_unlikely this will need to be used again since the proxy has already been initialized._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | the address to initialize |

### updateECOxExchange

  ```solidity
  function updateECOxExchange(address _newRoleHolder) public
  ```

_change the ECOxExchange address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newRoleHolder | address | the new ECOxExchange address |

