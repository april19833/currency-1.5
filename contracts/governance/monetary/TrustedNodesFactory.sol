// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CurrencyGovernance.sol";

contract TrustedNodesFactory is Policed, TimeUtils {
    ECOx public immutable ecoX;

    CurrencyGovernance public currencyGovernance;

    /** Event emitted when a new cohort is deployed
     * @param trustedNodes the address of the deployed cohort
     */
    event NewCohort(TrustedNodes trustedNodes);

    /** configures the factory to easily deploy
     * new TrustedNodes contracts after election
     * @param _policy the root policy address
     * @param _ecoX the ecoX address
     */
    constructor(
        Policy _policy,
        CurrencyGovernance _currencyGovernance,
        ECOx _ecoX
    ) Policed(_policy) {
        currencyGovernance = _currencyGovernance;
        ecoX = _ecoX;
    }

    /** Deploys a new TrustedNodes instance
     * @param _termLength the length of term for trustees in the new cohort
     * @param _voteReward the reward earned by each trustee each time they participate in voting
     * @param _newTrustees the new cohort of trustees
     * @return TrustedNodesAddress the address of the new TrustedNodes contract
     */
    function newCohort(
        uint256 _termLength,
        uint256 _voteReward,
        address[] calldata _newTrustees
    ) public onlyPolicy returns (address TrustedNodesAddress) {
        TrustedNodes trustedNodes = new TrustedNodes(
            policy,
            currencyGovernance,
            ecoX,
            _termLength,
            _voteReward,
            _newTrustees
        );
        emit NewCohort(trustedNodes);
        return address(trustedNodes);
    }

    /** Changes the holder currencyGovernance role
     * @param _currencyGovernance the new currencyGovernance role holder
     */
    function updateCurrencyGovernance(
        CurrencyGovernance _currencyGovernance
    ) public onlyPolicy {
        currencyGovernance = _currencyGovernance;
    }
}
