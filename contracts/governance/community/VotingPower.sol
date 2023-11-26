// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../policy/Policed.sol";
import "../../currency/ECO.sol";
import "../../currency/ECOx.sol";
import "./ECOxStaking.sol";

/**
 * @title VotingPower
 * @dev Compute voting power for user
 */
contract VotingPower is Policed {
    // ECOx voting power is snapshotted when the contract is cloned
    uint256 public totalECOxSnapshot;

    // voting power to exclude from totalVotingPower
    uint256 public excludedVotingPower;

    // the ECO contract address
    ECO public immutable ecoToken;

    // the ECO contract address
    ECOxStaking public immutable ecoXStaking;

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

        return _supply + 10 * totalECOxSnapshot - excludedVotingPower;
    }

    function votingPower(
        address _who,
        uint256 _snapshotBlock
    ) public view returns (uint256) {
        uint256 _power = ecoToken.voteBalanceSnapshot(_who);
        uint256 _powerx = ecoXStaking.votingECOx(_who, _snapshotBlock);
        // ECOx has 10x the voting power of ECO per unit
        return _power + 10 * _powerx;
    }
}
