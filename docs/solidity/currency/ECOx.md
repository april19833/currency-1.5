# Eco Association

Copyright (c) 2023 Eco Association

## ECOx

**An ERC20 token interface for ECOx**

### ecoXExchange

address of ECOxExchange contract

  ```solidity
  address ecoXExchange
  ```

### TransferFailed

error for when transfer returns false
used by contracts that import this contract

  ```solidity
  error TransferFailed()
  ```

### UpdatedECOxExchange

emits when the ECOxExchange address is changed

  ```solidity
  event UpdatedECOxExchange(address _old, address _new)
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _old | address | old holder of role |
| _new | address | new holder of role |

### constructor

Constructor

  ```solidity
  constructor(contract Policy _policy, address _pauser) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | The policy contract that oversees other contracts |
| _pauser | address | The address of the Pauser |

### initialize

unlikely this will need to be used again since the proxy has already been initialized.

  ```solidity
  function initialize(address _self) public virtual
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _self | address | the address to initialize |

### updateECOxExchange

change the ECOxExchange address

  ```solidity
  function updateECOxExchange(address _newRoleHolder) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newRoleHolder | address | the new ECOxExchange address |

