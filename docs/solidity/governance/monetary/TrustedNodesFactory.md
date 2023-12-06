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

Event emitted when a new cohort is deployed

```solidity
event NewCohort(contract TrustedNodes trustedNodes)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustedNodes | contract TrustedNodes | the address of the deployed cohort |

### constructor

configures the factory to easily deploy
new TrustedNodes contracts after election

```solidity
constructor(contract Policy _policy, contract CurrencyGovernance _currencyGovernance, contract ECOx _ecoX) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _policy | contract Policy | the root policy address |
| _currencyGovernance | contract CurrencyGovernance |  |
| _ecoX | contract ECOx | the ecoX address |

### newCohort

Deploys a new TrustedNodes instance

```solidity
function newCohort(uint256 _termLength, uint256 _voteReward, address[] _newTrustees) public returns (address TrustedNodesAddress)
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _termLength | uint256 | the length of term for trustees in the new cohort |
| _voteReward | uint256 | the reward earned by each trustee each time they participate in voting |
| _newTrustees | address[] | the new cohort of trustees |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| TrustedNodesAddress | address | the address of the new TrustedNodes contract |

### updateCurrencyGovernance

Changes the holder currencyGovernance role

```solidity
function updateCurrencyGovernance(contract CurrencyGovernance _currencyGovernance) public
```
#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _currencyGovernance | contract CurrencyGovernance | the new currencyGovernance role holder |

