# Eco Association

Copyright (c) 2023 Eco Association

## AccessRootPolicyFunds

**DeployRootPolicyFundw
A proposal to send some root policy funds to another
address (multisig, lockup, etc)**

### recipient

```solidity
address recipient
```

### eco

```solidity
contract ECO eco
```

### ecox

```solidity
contract ECOx ecox
```

### ecoAmount

```solidity
uint256 ecoAmount
```

### ecoXAmount

```solidity
uint256 ecoXAmount
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
constructor(address _recipient, contract ECO _eco, contract ECOx _ecox, uint256 _ecoAmount, uint256 _ecoXAmount, string _name, string _description, string _url) public
```

### enacted

```solidity
function enacted(address) public
```

