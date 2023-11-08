// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/community/proposals/Proposal.sol";
import "../policy/Policy.sol";
import "../currency/ECO.sol";
import "../currency/ECOx.sol";
import "../governance/monetary/Lockups.sol";
import "../governance/monetary/Rebase.sol";
import "../governance/monetary/Notifier.sol";
import "../governance/monetary/MonetaryPolicyAdapter.sol";
import "../governance/monetary/CurrencyGovernance.sol";
import "../governance/monetary/TrustedNodes.sol";


/** @title Testnet Linking Proposal
 *
 * A proposal used to link upwards permissions for all necessary contracts and mint tokens
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
        ECO _eco,
        ECOx _ecox,
        address _communityGovernance,
        address _ecoXExchange,
        Lockups _lockups,
        Notifier _lockupsNotifier,
        Rebase _rebase,
        Notifier _rebaseNotifier,
        MonetaryPolicyAdapter _monetaryPolicyAdapter,
        CurrencyGovernance _currencyGovernance,
        TrustedNodes _trustedNodes,
        uint256 _initialECOSupply,
        uint256 _initialECOxSupply
    ) Policy(address(0x0)) {
        distributor = msg.sender;
        eco = _eco;
        ecox = _ecox;
        communityGovernance = _communityGovernance;
        ecoXExchange = _ecoXExchange;
        lockups = _lockups;
        lockupsNotifier = _lockupsNotifier;
        rebase = _rebase;
        rebaseNotifier = _rebaseNotifier;
        monetaryPolicyAdapter = _monetaryPolicyAdapter;
        currencyGovernance = _currencyGovernance;
        trustedNodes = _trustedNodes;
        initialECOSupply = _initialECOSupply;
        initialECOxSupply = _initialECOxSupply;
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
        eco.updateMinters(address(this),true);
        eco.mint(distributor, initialECOSupply);
        eco.updateMinters(address(this),false);

        // mint initial ecox
        ecox.updateMinters(address(this),true);
        ecox.mint(distributor, initialECOxSupply);
        ecox.updateMinters(address(this),false);

        // link ecox
        ecox.updateECOxExchange(ecoXExchange);
        ecox.updateBurners(ecoXExchange, true);

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
