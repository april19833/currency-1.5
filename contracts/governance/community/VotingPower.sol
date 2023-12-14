// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../policy/Policed.sol";
import "../../currency/ECO.sol";
import "../../currency/ECOx.sol";
import "./ECOxStaking.sol";

/** @title VotingPower
 * Compute voting power for user
 */
contract VotingPower is Policed {
    // the ECO contract address
    ECO public immutable ecoToken;

    // the ECOxStaking contract address
    ECOxStaking public immutable ecoXStaking;

    /** @notice snapshot block for calculating voting power */
    uint256 public snapshotBlock;

    constructor(
        Policy _policy,
        ECO _ecoAddr,
        ECOxStaking _ecoXStakingAddr
    ) Policed(_policy) {
        if (address(_ecoAddr) == address(0)) {
            revert NonZeroContractAddr("ECO");
        }
        if (address(_ecoXStakingAddr) == address(0)) {
            revert NonZeroContractAddr("ECOxStaking");
        }
        ecoToken = _ecoAddr;
        ecoXStaking = _ecoXStakingAddr;
    }

    function totalVotingPower() public view returns (uint256) {
        uint256 _supply = ecoToken.totalSupplySnapshot();
        uint256 _supplyX = ecoXStaking.totalVotingECOx(snapshotBlock);
        // ECOx has 10x the voting power of ECO per unit
        return _supply + 10 * _supplyX;
    }

    function votingPower(address _who) public view returns (uint256) {
        uint256 _power = ecoToken.voteBalanceSnapshot(_who);
        uint256 _powerX = ecoXStaking.votingECOx(_who, snapshotBlock);
        // ECOx has 10x the voting power of ECO per unit
        return _power + 10 * _powerX;
    }
}
