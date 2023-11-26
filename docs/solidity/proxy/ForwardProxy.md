# Eco Association

Copyright (c) 2023 Eco Association

## ForwardProxy

**Upgradable proxy**

### constructor

  ```solidity
  constructor(contract ForwardTarget _impl) public
  ```

Construct a new proxy.

  ####
  Parameters | Name | Type | Description | | ---- | ---- | ----------- |
    |
    _impl
    |
    contract ForwardTarget
    |
    The default target address.
    |

### fallback

  ```solidity
  fallback() external payable
  ```

Default function that forwards call to proxy target

