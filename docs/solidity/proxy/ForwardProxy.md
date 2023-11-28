# Eco Association

Copyright (c) 2023 Eco Association

## ForwardProxy

**Upgradable proxy**

### constructor

Construct a new proxy.

  ```solidity
  constructor(contract ForwardTarget _impl) public
  ```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _impl | contract ForwardTarget | The default target address. |

### fallback

Default function that forwards call to proxy target

  ```solidity
  fallback() external payable
  ```

