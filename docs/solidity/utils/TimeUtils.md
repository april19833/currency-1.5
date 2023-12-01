# Eco Association

Copyright (c) 2023 Eco Association

## TimeUtils

**TimeUtils**

Utility class for time, allowing easy unit testing.

### getTime

Determine the current time as perceived by the policy timing contract.

Used extensively in testing, but also useful in production for
determining what processes can currently be run.

```solidity
function getTime() internal view returns (uint256)
```

