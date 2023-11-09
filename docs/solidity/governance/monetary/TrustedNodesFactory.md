# Eco Association

Copyright (c) 2023 Eco Association

## TrustedNodesFactory

### ecoX

```solidity
contract ECOx ecoX
```

### currencyGovernance

```solidity
contract CurrencyGovernance currencyGovernance
```

### NewCohort

```solidity
event NewCohort(contract TrustedNodes trustedNodes)
```

Event emitted when a new cohort is deployed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustedNodes | contract TrustedNodes | the address of the deployed cohort |

### constructor

```solidity
constructor(contract Policy _policy, contract CurrencyGovernance _currencyGovernance, contract ECOx _ecoX) public
```

configures the factory to easily deploy
new TrustedNodes contracts after election

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | the root policy address |
| _currencyGovernance | contract CurrencyGovernance |  |
| _ecoX | contract ECOx | the ecoX address |

### newCohort

```solidity
function newCohort(uint256 _termLength, uint256 _voteReward, address[] _newTrustees) public returns (address)
```

Deploys a new TrustedNodes instance

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _termLength | uint256 | the length of term for trustees in the new cohort |
| _voteReward | uint256 | the reward earned by each trustee each time they participate in voting |
| _newTrustees | address[] | the new cohort of trustees |

### updateCurrencyGovernance

```solidity
function updateCurrencyGovernance(contract CurrencyGovernance _currencyGovernance) public
```

Changes the holder currencyGovernance role

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _currencyGovernance | contract CurrencyGovernance | the new currencyGovernance role holder |

