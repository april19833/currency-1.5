# Eco Association
Copyright (c) 2023 Eco Association

## TimeUtils

### getTime

```solidity
function getTime() internal view returns (uint256)
```

Determine the current time as perceived by the policy timing contract.

Used extensively in testing, but also useful in production for
determining what processes can currently be run.
