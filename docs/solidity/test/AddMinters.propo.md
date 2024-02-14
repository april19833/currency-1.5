# Eco Association

Copyright (c) 2023 Eco Association

## AddMinters

**AddMinters
A proposal to add some minters
strictly a test, please dont actually do this**

### newMinters

```solidity
address[] newMinters
```

### mintersLength

```solidity
uint256 mintersLength
```

### eco

```solidity
contract ECO eco
```

### ecox

```solidity
contract ECOx ecox
```

### name

The name of the proposal.

This should be relatively unique and descriptive.

```solidity
string name
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |

### description

A longer description of what this proposal achieves.

```solidity
string description
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |

### url

A URL where voters can go to see the case in favour of this proposal,
and learn more about it.

```solidity
string url
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |

### constructor

```solidity
constructor(address[] _newMinters, contract ECO _eco, contract ECOx _ecox, string _name, string _description, string _url) public
```

### enacted

```solidity
function enacted(address self) public
```

