// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TimeUtils
 * @notice Utility class for time, allowing easy unit testing.
 */
abstract contract TimeUtils {
    /** Determine the current time as perceived by the policy timing contract.
     *
     * Used extensively in testing, but also useful in production for
     * determining what processes can currently be run.
     * @return blockTimeStamp The current block timestamp
     */
    function getTime() internal view returns (uint256 blockTimeStamp) {
        // solhint-disable-next-line not-rely-on-time
        return block.timestamp;
    }
}
