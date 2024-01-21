// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../governance/community/proposals/Proposal.sol";
import "../../policy/Policy.sol";
import "../../currency/ECO.sol";
import "../../currency/ECOx.sol";
import "../../currency/ECOxExchange.sol";
import "../../governance/monetary/Lockups.sol";
import "../../governance/monetary/Rebase.sol";
import "../../governance/monetary/Notifier.sol";
import "../../governance/monetary/MonetaryPolicyAdapter.sol";
import "../../governance/monetary/CurrencyGovernance.sol";
import "../../governance/monetary/TrustedNodes.sol";

/**
 * @title Testnet Linking Proposal
 * @notice A proposal used to link upwards permissions for all necessary contracts and mint tokens
 */
contract TestnetLinker is Policy, Proposal {
    address public immutable distributor;

    ECO public immutable eco;

    ECOx public immutable ecox;

    address public immutable communityGovernance;

    address public immutable ecoXExchange;

    Lockups public immutable lockups;

    Notifier public immutable lockupsNotifier;

    Rebase public immutable rebase;

    Notifier public immutable rebaseNotifier;

    MonetaryPolicyAdapter public immutable monetaryPolicyAdapter;

    CurrencyGovernance public immutable currencyGovernance;

    TrustedNodes public immutable trustedNodes;

    uint256 public immutable initialECOSupply;

    uint256 public immutable initialECOxSupply;

    constructor(
        address _communityGovernance,
        ECOxExchange _ecoXExchange,
        Notifier _lockupsNotifier,
        Notifier _rebaseNotifier,
        TrustedNodes _trustedNodes,
        uint256 _initialECOSupply
    ) Policy(address(0x0)) {
        distributor = msg.sender;
        communityGovernance = _communityGovernance;
        ecoXExchange = address(_ecoXExchange);
        lockupsNotifier = _lockupsNotifier;
        rebaseNotifier = _rebaseNotifier;
        trustedNodes = _trustedNodes;

        eco = _ecoXExchange.eco();
        ecox = _ecoXExchange.ecox();
        lockups = Lockups(_lockupsNotifier.lever());
        rebase = Rebase(_rebaseNotifier.lever());
        currencyGovernance = _trustedNodes.currencyGovernance();
        monetaryPolicyAdapter = currencyGovernance.enacter();

        initialECOSupply = _initialECOSupply;
        initialECOxSupply = _ecoXExchange.initialSupply();
    }

    /** The name of the proposal.
     */
    function name() public pure override returns (string memory) {
        return "Testnet Linker";
    }

    /** A description of what the proposal does.
     */
    function description() public pure override returns (string memory) {
        return "Add role permissions and mint initial tokens";
    }

    /** A URL for more information.
     */
    function url() public pure override returns (string memory) {
        return "n/a";
    }

    /** Enact the proposal.
     */
    function enacted(address) public override {
        // removes the temporary governance permissions and binds the contract
        this.updateGovernor(communityGovernance);

        // mint initial eco
        eco.updateMinters(address(this), true);
        eco.mint(distributor, initialECOSupply);
        eco.updateMinters(address(this), false);

        // mint initial ecox
        ecox.updateMinters(address(this), true);
        ecox.mint(distributor, initialECOxSupply);
        ecox.updateMinters(address(this), false);

        // link ecox
        ecox.updateECOxExchange(ecoXExchange);
        ecox.updateBurners(ecoXExchange, true);
        ecox.updateSnapshotters(communityGovernance, true);

        // link eco
        eco.updateMinters(ecoXExchange, true);
        eco.updateMinters(address(lockups), true);
        eco.updateRebasers(address(rebase), true);
        eco.updateSnapshotters(communityGovernance, true);

        // link levers
        lockups.setAuthorized(address(monetaryPolicyAdapter), true);
        lockups.setNotifier(lockupsNotifier);
        rebase.setAuthorized(address(monetaryPolicyAdapter), true);
        rebase.setNotifier(rebaseNotifier);

        // link adapter
        monetaryPolicyAdapter.setCurrencyGovernance(currencyGovernance);

        // link currency governance
        currencyGovernance.setTrustedNodes(trustedNodes);
    }
}
