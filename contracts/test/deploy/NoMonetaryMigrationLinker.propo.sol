// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../governance/community/proposals/Proposal.sol";
import "../../policy/Policy.sol";
import "../../currency/ECO.sol";
import "../../currency/ECOx.sol";
import "../../currency/ECOxExchange.sol";
import "../../governance/community/CommunityGovernance.sol";
import {Policed as PolicedOld} from "@helix-foundation/currency-dev/contracts/policy/Policed.sol";
import {ECO as ECOOld} from "@helix-foundation/currency-dev/contracts/currency/ECO.sol";
import {ImplementationUpdatingTarget} from "@helix-foundation/currency-dev/contracts/test/ImplementationUpdatingTarget.sol";

/** @title Migration Proposal
 *
 * A proposal used to update the 1.0 proxies and link upwards permissions for all necessary contracts
 */
contract MigrationLinker is Policy, Proposal {
    address public immutable newEcoImpl;

    address public immutable ecoProxyAddress;

    address public immutable newEcoxImpl;

    address public immutable ecoxProxyAddress;

    address public immutable newEcoxStakingImpl;

    address public immutable ecoXStakingProxyAddress;

    CommunityGovernance public immutable communityGovernance;

    ECOxExchange public immutable ecoXExchange;

    address public immutable newPolicyImpl;

    /** The address of the updating contract for proxies
     */
    address public immutable implementationUpdatingTarget;

    /** The address of the updating contract for inflationMultiplier
     */
    address public immutable snapshotUpdatingTarget;

    constructor(
        CommunityGovernance _communityGovernance,
        ECOxExchange _ecoXExchange,
        address _newPolicyImpl,
        address _newEcoImpl,
        address _newEcoxImpl,
        address _newEcoxStakingImpl,
        address _implementationUpdatingTarget,
        address _snapshotUpdatingTarget
    ) Policy(address(0x0)) {
        communityGovernance = _communityGovernance;
        ecoXExchange = _ecoXExchange;

        newPolicyImpl = _newPolicyImpl;
        newEcoImpl = _newEcoImpl;
        newEcoxImpl = _newEcoxImpl;
        newEcoxStakingImpl = _newEcoxStakingImpl;
        implementationUpdatingTarget = _implementationUpdatingTarget;
        snapshotUpdatingTarget = _snapshotUpdatingTarget;

        ecoProxyAddress = address(_ecoXExchange.eco());
        ecoxProxyAddress = address(_ecoXExchange.ecox());
        ecoXStakingProxyAddress = address(communityGovernance.ecoXStaking());
    }

    /** The name of the proposal.
     */
    function name() public pure override returns (string memory) {
        return "Eco Protocol Migrator and Linker";
    }

    /** A description of what the proposal does.
     */
    function description() public pure override returns (string memory) {
        return "Update 1.0 proxies and add role permissions";
    }

    /** A URL for more information.
     */
    function url() public pure override returns (string memory) {
        return "n/a";
    }

    /** Enact the proposal.
     */
    function enacted(address) public override {
        // update root policy
        (bool success, bytes memory returnedData) = implementationUpdatingTarget
            .delegatecall(
                abi.encodeWithSelector(
                    ImplementationUpdatingTarget.updateImplementation.selector,
                    newPolicyImpl
                )
            );

        if (!success) {
            revert(string(returnedData));
        }

        // add new governance permissions
        this.updateGovernor(address(communityGovernance));

        // get old inflation multiplier
        uint256 _inflationMultiplier = ECOOld(ecoProxyAddress)
            .getPastLinearInflation(block.number);

        // give eco the new multiplier
        PolicedOld(ecoProxyAddress).policyCommand(
            snapshotUpdatingTarget,
            abi.encodeWithSignature(
                "setInflationMultiplier(uint256)",
                _inflationMultiplier
            )
        );

        // propogate total supply snapshots in eco and ecox
        PolicedOld(ecoProxyAddress).policyCommand(
            snapshotUpdatingTarget,
            abi.encodeWithSignature("setTotalSupplySnapshot()")
        );

        PolicedOld(ecoxProxyAddress).policyCommand(
            snapshotUpdatingTarget,
            abi.encodeWithSignature("setTotalSupplySnapshot()")
        );

        // update ecox
        PolicedOld(ecoxProxyAddress).policyCommand(
            implementationUpdatingTarget,
            abi.encodeWithSignature(
                "updateImplementation(address)",
                newEcoxImpl
            )
        );

        // link ecox
        ECOx(ecoxProxyAddress).updateBurners(address(ecoXExchange), true);

        // update eco
        PolicedOld(ecoProxyAddress).policyCommand(
            implementationUpdatingTarget,
            abi.encodeWithSignature("updateImplementation(address)", newEcoImpl)
        );

        // link eco
        ECO(ecoProxyAddress).updateMinters(address(ecoXExchange), true);
        ECO(ecoProxyAddress).updateSnapshotters(
            address(communityGovernance),
            true
        );

        // link ecox
        ECOx(ecoxProxyAddress).updateSnapshotters(
            address(communityGovernance),
            true
        );

        // perform eco initialization
        ECO(ecoProxyAddress).updateRebasers(address(this), true);
        ECO(ecoProxyAddress).rebase(
            ECO(ecoProxyAddress).INITIAL_INFLATION_MULTIPLIER()
        );
        ECO(ecoProxyAddress).updateRebasers(address(this), false);
        ECO(ecoProxyAddress).updateSnapshotters(address(this), true);
        ECO(ecoProxyAddress).snapshot();
        ECO(ecoProxyAddress).updateSnapshotters(address(this), false);

        // perform ecox initialization
        ECOx(ecoxProxyAddress).updateSnapshotters(address(this), true);
        ECOx(ecoxProxyAddress).snapshot();
        ECOx(ecoxProxyAddress).updateSnapshotters(address(this), false);

        // update ecoXStaking
        PolicedOld(ecoXStakingProxyAddress).policyCommand(
            implementationUpdatingTarget,
            abi.encodeWithSignature(
                "updateImplementation(address)",
                newEcoxStakingImpl
            )
        );
    }
}
