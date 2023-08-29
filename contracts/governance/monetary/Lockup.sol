// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../currency/ECO.sol";
import "./Notifier.sol";
import "./Lever.sol";
import "../../utils/TimeUtils.sol";

/** @title Trustee monetary policy decision process
 *
 * This contract oversees the voting on the currency monetary levers.
 * Trustees vote on a policy that is implemented at the conclusion of the cycle
 */
contract Lockup is Lever, TimeUtils {
    
    struct Lockup {
        uint256 rate;
        
        uint256 start;

        uint256 end;

        mapping(address => uint256) gonsBalances;

        uint256 totalGons;

        bool minted;
    }

    ECO public immutable eco;

    mapping(uint256 => Lockup) public lockups;

    error EarlyWithdrawFor(address withdrawer, address recipient);

    constructor(
        Policy policy,
        Notifier notifier,
        ECO _eco
    ) Lever(policy, notifier) {
        eco = _eco;
    }

    function createLockup(uint256 _duration, uint256 _rate) public onlyAuthorized {

    }

    function deposit(uint256 _lockupId, uint256 _amount) public {

    }

    function withdraw(uint256 _lockupId) public {
        _withdraw(_lockupId, msg.sender);
    }

    function withdrawFor(uint256 _lockupId, address recipient) public {
        _withdraw(_lockupId, recipient);
    }

    function _withdraw(uint256 _lockupId, address recipient) internal {
        Lockup storage lockup = lockups[_lockupId];
        uint256 amount = lockup.gonsBalances(recipient);
        uint256 interest = amount * lockup.rate;
        
        if (!lockup.minted) {
            if (getTime() < lockup.end) {
                if (msg.sender != recipient) {
                    revert (EarlyWithdrawFor());
                }
                amount -= interest;
            } else {
                lockup.minted = true;
                mintInterest();
                amount += interest;
            }
        } else {
            amount += interest;
        }
        lockup.gonsAmount[recipient] = 0;

        eco.transfer(eco.getInflationMultiplier() * amount, recipient);
    }

    function getBalance(uint256 _lockupId, address _who) public returns (uint256 ecoAmount) {
        return lockups[_lockupId].gonsBalances[_who] * eco.getInflationMultiplier();
    }

    function mintInterest(uint256 _lockupId) internal {
        Lockup storage lockup = lockups[_lockupId];

        eco.mint(address(this), lockup.total * lockup.rate * eco.getInflationMultiplier());
    }

}