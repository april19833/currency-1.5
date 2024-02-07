// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../policy/Policed.sol";
import "../../currency/ECO.sol";
import "../../currency/ECOx.sol";
import "./ECOxStaking.sol";

/**
 * @title VotingPower
 * @notice Compute voting power for user
 */
contract VotingPower is Policed {
    // the ECO contract address
    ECO public immutable ecoToken;

    // the ECOx contract address
    ECOx public immutable ecoXToken;

    // the ECOxStaking contract address
    ECOxStaking public immutable ecoXStaking;

    /** @notice snapshot block for calculating voting power */
    uint256 public snapshotBlock;

    // error for if total voting power is accessed during the snapshot block
    error NoAtomicActionsWithSnapshot();

    constructor(
        Policy _policy,
        ECO _ecoAddr,
        ECOx _ecoXAddr,
        ECOxStaking _ecoXStakingAddr
    ) Policed(_policy) {
        if (address(_ecoAddr) == address(0)) {
            revert NonZeroContractAddr("ECO");
        }
        if (address(_ecoXAddr) == address(0)) {
            revert NonZeroContractAddr("ECOx");
        }
        if (address(_ecoXStakingAddr) == address(0)) {
            revert NonZeroContractAddr("ECOxStaking");
        }
        ecoToken = _ecoAddr;
        ecoXToken = _ecoXAddr;
        ecoXStaking = _ecoXStakingAddr;
    }

    /**
     * Calculates the total Voting Power by getting the total supply of ECO
     * and adding total ECOX (multiplied by 10) and subtracting the excluded Voting Power
     * @return total the total Voting Power
     */
    function totalVotingPower() public view returns (uint256 total) {
        if (block.number == snapshotBlock) {
            revert NoAtomicActionsWithSnapshot();
        }

        uint256 _supply = ecoToken.totalSupplySnapshot();
        uint256 _supplyX = ecoXToken.totalSupplySnapshot();
        // ECOx has 10x the voting power of ECO per unit
        return _supply + 10 * _supplyX;
    }

    /**
     * Calculates the voting power for an address at the Snapshot Block
     * @param _who the address to calculate the voting power for
     * @return total the total vorting power for an address at the Snapshot Block
     */

    function votingPower(address _who) public view returns (uint256 total) {
        if (block.number == snapshotBlock) {
            revert NoAtomicActionsWithSnapshot();
        }
        uint256 _power = ecoToken.voteBalanceSnapshot(_who);
        uint256 _powerX = ecoXStaking.votingECOx(_who, snapshotBlock);
        // ECOx has 10x the voting power of ECO per unit
        return _power + 10 * _powerX;
    }
}
