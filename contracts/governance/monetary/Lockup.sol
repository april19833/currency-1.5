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
        
        uint256 depositWindowEnd;

        uint256 end;

        mapping(address => uint256) gonsBalances;

        mapping(address => uint256) interest;

        uint256 totalInterest;

        bool minted;
    }

    uint256 constant MAX_RATE = 5E17;
    
    uint256 constant MIN_DURATION = 3600*24*30;

    uint256 constant MAX_DURATION = 3600*24*365;

    uint256 constant BASE = 1e18;

    ECO public immutable eco;

    uint256 internal nextId;

    uint256 public currentInflationMultiplier;

    uint256 public depositWindow;

    mapping(uint256 => Lockup) public lockups;

    error EarlyWithdrawFor(uint256 lockupId, address withdrawer, address recipient);

    error LateDeposit(uint256 lockupId, address depositor);

    error BadRate(uint256 rate);

    error BadDuration(uint256 rate);

    event LockupCreation(uint256 lockupId, uint256 duration, uint256 rate);

    event LockupDeposit(uint256 lockupId, address depositor, uint256 gonsDepositAmount);

    event LockupWithdrawal(uint256 lockupId, address withdrawer, uint256 gonsWithdrawnAmount);

    constructor(
        Policy policy,
        Notifier notifier,
        ECO _eco
    ) Lever(policy, notifier) {
        eco = _eco;
    }

    function createLockup(uint256 _duration, uint256 _rate) public onlyAuthorized {
        if (_rate > MAX_RATE) {
            revert BadRate(_rate);
        }
        if (_duration > MAX_DURATION || _duration < MIN_DURATION) {
            revert BadDuration(_duration);
        }
        uint256 timeNow = getTime();

        Lockup storage lockup = lockups[nextId];
        lockup.rate = _rate;
        lockup.depositWindowEnd = timeNow + depositWindow;
        lockup.end = lockup.depositWindowEnd + _duration;

        emit LockupCreation(nextId, _duration, _rate);
        nextId += 1;

    }
    function deposit(uint256 _lockupId, uint256 _amount) public {
        _deposit(_lockupId, msg.sender, _amount);
    }

    function depositFor(uint256 _lockupId, address beneficiary, uint256 _amount) public {
        _deposit(_lockupId, beneficiary, _amount);
    }

    function _deposit(uint256 _lockupId, address beneficiary, uint256 _amount) internal {
        Lockup storage lockup = lockups[_lockupId];
        if(getTime() >= lockup.depositWindowEnd) {
            revert LateDeposit(_lockupId, msg.sender);
        }
        uint256 interest = _amount * lockup.rate;
        lockup.interest[msg.sender] += interest;
        lockup.totalInterest += interest;
        lockup.gonsBalances[msg.sender] += _amount * currentInflationMultiplier / BASE;
        eco.transferFrom(msg.sender, address(this), _amount);
    }

    function withdraw(uint256 _lockupId) public {
        _withdraw(_lockupId, msg.sender);
    }

    function withdrawFor(uint256 _lockupId, address recipient) public {
        _withdraw(_lockupId, recipient);
    }

    function _withdraw(uint256 _lockupId, address recipient) internal {
        Lockup storage lockup = lockups[_lockupId];
        uint256 amount = lockup.gonsBalances[recipient] / currentInflationMultiplier;
        uint256 interest = lockup.interest[recipient];
        
        if (!lockup.minted) {
            if (getTime() < lockup.end) {
                if (msg.sender != recipient) {
                    revert EarlyWithdrawFor(_lockupId, msg.sender, recipient);
                }
                amount -= interest;
            } else {
                lockup.minted = true;
                _mintInterest(_lockupId);
                amount += interest;
            }
        } else {
            amount += interest;
        }
        lockup.gonsBalances[recipient] = 0;
        lockup.interest[recipient] = 0;

        eco.transfer(recipient, amount);
    }

    function getBalance(uint256 _lockupId, address _who) public returns (uint256 ecoAmount) {
        return lockups[_lockupId].gonsBalances[_who] / eco.getInflationMultiplier();
    }

    function _mintInterest(uint256 _lockupId) internal {
        Lockup storage lockup = lockups[_lockupId];

        // eco.mint(address(this), lockup.totalInterest * lockup.rate * eco.getInflationMultiplier());
        eco.mint(address(this), lockup.totalInterest);
    }

    function sweep(address _destination) public onlyPolicy {
        eco.transfer(_destination, eco.balanceOf(address(this)));
    }

}