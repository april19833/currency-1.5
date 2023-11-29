// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/community/proposals/Proposal.sol";
import "../policy/Policy.sol";
import "../currency/ECO.sol";
import "../currency/ECOx.sol";
import "../currency/ECOxExchange.sol";
import "../governance/community/CommunityGovernance.sol";
import "../governance/monetary/Lockups.sol";
import "../governance/monetary/Rebase.sol";
import "../governance/monetary/Notifier.sol";
import "../governance/monetary/MonetaryPolicyAdapter.sol";
import "../governance/monetary/CurrencyGovernance.sol";
import "../governance/monetary/TrustedNodes.sol";
import {Policed as PolicedOld} from "@helix-foundation/currency-dev/contracts/policy/Policed.sol";

/** @title Testnet Linking Proposal
 *
 * A proposal used to link upwards permissions for all necessary contracts and mint tokens
 */
contract MigrationLinker is Policy, Proposal {
    address public immutable newEcoImpl;

    address public immutable ecoProxyAddress;

    address public immutable newEcoxImpl;

    address public immutable ecoxProxyAddress;

    address public immutable ecoXStakingProxyAddress;

    address public immutable newEcoxStakingImpl;

    CommunityGovernance public immutable communityGovernance;

    ECOxExchange public immutable ecoXExchange;

    address public immutable lockups;

    Notifier public immutable lockupsNotifier;

    address public immutable rebase;

    Notifier public immutable rebaseNotifier;

    MonetaryPolicyAdapter public immutable monetaryPolicyAdapter;

    CurrencyGovernance public immutable currencyGovernance;

    TrustedNodes public immutable trustedNodes;

    address public immutable newPolicyImpl;

    /** The address of the updating contract for proxies
     */
    address public immutable implementationUpdatingTarget;

    constructor(
        CommunityGovernance _communityGovernance,
        ECOxExchange _ecoXExchange,
        Notifier _lockupsNotifier,
        Notifier _rebaseNotifier,
        TrustedNodes _trustedNodes,
        address _newPolicyImpl,
        address _newEcoImpl,
        address _newEcoxImpl,
        address _newEcoxStakingImpl,
        address _implementationUpdatingTarget
    ) Policy(address(0x0)) {
        communityGovernance = _communityGovernance;
        ecoXExchange = _ecoXExchange;
        lockupsNotifier = _lockupsNotifier;
        rebaseNotifier = _rebaseNotifier;
        trustedNodes = _trustedNodes;

        newPolicyImpl = _newPolicyImpl;
        newEcoImpl = _newEcoImpl;
        newEcoxImpl = _newEcoxImpl;
        newEcoxStakingImpl = _newEcoxStakingImpl;
        implementationUpdatingTarget = _implementationUpdatingTarget;

        ecoProxyAddress = address(_ecoXExchange.eco());
        ecoxProxyAddress = address(_ecoXExchange.ecox());
        lockups = _lockupsNotifier.lever();
        rebase = _rebaseNotifier.lever();
        currencyGovernance = _trustedNodes.currencyGovernance();
        monetaryPolicyAdapter = currencyGovernance.enacter();
        ecoXStakingProxyAddress = address(communityGovernance.ecoXStaking());
    }

    /** The name of the proposal.
     */
    function name() public pure override returns (string memory) {
        return "Testnet Migrator and Linker";
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
        // update eco
        PolicedOld(ecoxProxyAddress).policyCommand(
            implementationUpdatingTarget,
            abi.encodeWithSignature(
                "updateImplementation(address)",
                newEcoxImpl
            )
        );

        // link ecox
        ECOx(ecoxProxyAddress).updateECOxExchange(address(ecoXExchange));
        ECOx(ecoxProxyAddress).updateBurners(address(ecoXExchange), true);

        // update eco
        PolicedOld(ecoProxyAddress).policyCommand(
            implementationUpdatingTarget,
            abi.encodeWithSignature("updateImplementation(address)", newEcoImpl)
        );

        // link eco
        ECO(ecoProxyAddress).updateMinters(address(ecoXExchange), true);
        ECO(ecoProxyAddress).updateMinters(lockups, true);
        ECO(ecoProxyAddress).updateRebasers(rebase, true);
        ECO(ecoProxyAddress).updateSnapshotters(
            address(communityGovernance),
            true
        );

        // update ecoXStaking
        PolicedOld(ecoXStakingProxyAddress).policyCommand(
            implementationUpdatingTarget,
            abi.encodeWithSignature(
                "updateImplementation(address)",
                newEcoxStakingImpl
            )
        );

        // update root policy
        setImplementation(newPolicyImpl);

        // add new governance permissions
        this.updateGovernor(address(communityGovernance));

        // link levers
        Lockups(lockups).setAuthorized(address(monetaryPolicyAdapter), true);
        Lockups(lockups).setNotifier(lockupsNotifier);
        Rebase(rebase).setAuthorized(address(monetaryPolicyAdapter), true);
        Rebase(rebase).setNotifier(rebaseNotifier);

        // link adapter
        monetaryPolicyAdapter.setCurrencyGovernance(currencyGovernance);

        // link currency governance
        currencyGovernance.setTrustedNodes(trustedNodes);
    }
}
