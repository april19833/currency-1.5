// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../policy/Policy.sol";
import "../../../policy/Policed.sol";
import "./Proposal.sol";
import "../../monetary/Notifier.sol";

/** @title LockupUpgradeAndNotifier
 * A proposal to update the Lockup implementation
 * Also
 */
contract AddTxToNotifier is Policy, Proposal {
    // The address the notifier
    Notifier public immutable notifier;

    // The address of the target
    address public immutable target;

    // The data for performing a call
    bytes public txData;

    // The gas cost of the call
    uint256 public immutable gasCost;

    /** Instantiate a new proposal.
     *
     * @param _notifier the addres of the notifier the tx is being added to
     * @param _target target of tx
     * @param _txData tx data
     * @param _gasCost cost of tx
     */
    constructor(
        Notifier _notifier,
        address _target,
        bytes memory _txData,
        uint256 _gasCost
    ) Policy(address(0x0)) {
        notifier = _notifier;
        target = _target;
        txData = _txData;
        gasCost = _gasCost;
    }

    /** The name of the proposal.
     */
    function name() public pure override returns (string memory) {
        return "add tx to notifier";
    }

    /** A description of what the proposal does.
     */
    function description() public pure override returns (string memory) {
        return "This proposal adds a tx to a notifier";
    }

    /** A URL where more details can be found.
     */
    function url() public pure override returns (string memory) {
        return "url";
    }

    /** Adds new tx to notifier */
    function enacted(address self) public override {
        notifier.addTransaction(
            target,
            AddTxToNotifier(self).txData(),
            gasCost
        );
    }
}
