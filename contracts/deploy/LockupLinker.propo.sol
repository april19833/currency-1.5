// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/community/proposals/Proposal.sol";
import "../policy/Policy.sol";
import "../currency/ECO.sol";
import "../governance/monetary/Lockups.sol";
import "../governance/monetary/Notifier.sol";

/** @title Lockup-only Linking Proposal
 *
 * A proposal used to link upwards permissions for the lockup contract which must be deployed after the migration
 */
contract LockupLinker is Policy, Proposal {
    ECO public immutable eco;

    address public immutable lockups;

    Notifier public immutable lockupsNotifier;

    address public immutable monetaryPolicyAdapter;

    constructor(
        Notifier _lockupsNotifier,
        address _monetaryPolicyAdapter
    ) Policy(address(0x0)) {
        lockupsNotifier = _lockupsNotifier;
        monetaryPolicyAdapter = _monetaryPolicyAdapter;

        lockups = _lockupsNotifier.lever();
        eco = Lockups(lockups).eco();
    }

    /** The name of the proposal.
     */
    function name() public pure override returns (string memory) {
        return "Testnet Lockup Linker";
    }

    /** A description of what the proposal does.
     */
    function description() public pure override returns (string memory) {
        return "Integrate the Lockup lever";
    }

    /** A URL for more information.
     */
    function url() public pure override returns (string memory) {
        return "n/a";
    }

    /** Enact the proposal.
     */
    function enacted(address) public override {
        // link to eco
        eco.updateMinters(lockups, true);

        // link lockup lever
        Lockups(lockups).setAuthorized(address(monetaryPolicyAdapter), true);
        Lockups(lockups).setNotifier(lockupsNotifier);
    }
}
