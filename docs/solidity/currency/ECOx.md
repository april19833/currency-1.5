# Eco Association

Copyright (c) 2023 Eco Association

## ECOx

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

emits when the ECOxExchange address is changed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _old | address | old holder of role |
| _new | address | new holder of role |

### constructor

```solidity
constructor(contract Policy _policy, address _ecoXExchange, address _pauser) public
```

### initialize

```solidity
function initialize(address _self) public virtual
```

unlikely this will need to be used again since the proxy has already been initialized.

### updateECOxExchange

```solidity
function updateECOxExchange(address _newRoleHolder) public
```

_change the ECOxExchange address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newRoleHolder | address | the new ECOxExchange address |

