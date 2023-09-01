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
contract Lockups is Lever, TimeUtils {
    // data structure for lockups
    struct Lockup {
        // yield at time of lockup creation
        // actual yield upon withdrawal may be different due to linear inflation
        uint256 rate;
        // timestamp at which the lockup deposit window closes
        uint256 depositWindowEnd;
        // timestamp after which depositors can withdraw to claim yield + not be penalized
        uint256 end;
        // gons balances of depositors
        mapping(address => uint256) gonsBalances;
        // interest to be minted to depositors upon timely withdrawal
        // the amount minted will remain the same regardless of changes in linear inflation
        mapping(address => uint256) interest;
    }

    // denominator when multiplying by rate to get yield amount
    uint256 internal constant BASE = 1e18;

    // ceiling on yield --> 50%
    uint256 public constant MAX_RATE = 5E17;
    // floor for lockup duration --> 30 days
    uint256 public constant MIN_DURATION = 3600 * 24 * 30;
    // ceiling for lockup duration --> 365 days
    uint256 public constant MAX_DURATION = 3600 * 24 * 365;

    // id of the next lockup created
    uint256 internal nextId;

    // address of ECO
    ECO public immutable eco;

    // length of the deposit window
    uint256 public depositWindow;

    // current linear inflation multiplier for ECO
    uint256 public currentInflationMultiplier;

    // mapping of Lockups, indexed by lockupId
    mapping(uint256 => Lockup) public lockups;

    // sum of early withdraw penalties in gons
    uint256 penalties;

    // rate is out of bounds
    error BadRate();

    // duration is out of bounds
    error BadDuration();

    /** withdrawFor called before lockup end
     * @param lockupId: ID of lockup from which withdrawal was attempted
     * @param withdrawer: address that called withdrawFor
     * @param recipient: address on whose behalf withdrawFor was called
     */
    error EarlyWithdrawFor(
        uint256 lockupId,
        address withdrawer,
        address recipient
    );

    /** attempted deposit after deposit window has closed
     * @param lockupId: ID of lockup to which deposit was attempted
     * @param depositor: address that tried to deposit
     */
    error LateDeposit(uint256 lockupId, address depositor);

    /** lockup created
     * @param lockupId: ID of lockup
     * @param duration: duration of lockup
     * @param rate: yield rate of lockup at creation
     */
    event LockupCreation(uint256 lockupId, uint256 duration, uint256 rate);

    /** deposit made to lockup
     * @param lockupId: ID of lockup
     * @param depositor: address whose ECO were deposited
     * @param gonsDepositAmount: amount in gons that was deposited to lockup
     */
    event LockupDeposit(
        uint256 lockupId,
        address depositor,
        uint256 gonsDepositAmount
    );

    /** withdrawal made from lockup
     * @param lockupId: ID of lockup
     * @param recipient: address receiving withdrawal
     * @param gonsWithdrawnAmount: amount in gons that was withdrawn
     */
    event LockupWithdrawal(
        uint256 lockupId,
        address recipient,
        uint256 gonsWithdrawnAmount
    );

    /** constructor
     * @param _policy the owning policy address for the contract
     * @param _notifier the notifier handling downstream calls from this contract
     * @param _eco the ECO contract
     * @param _depositWindow length of the deposit window
     */
    constructor(
        Policy _policy,
        Notifier _notifier,
        ECO _eco,
        uint256 _depositWindow
    ) Lever(_policy, _notifier) {
        eco = _eco;
        depositWindow = _depositWindow;
        currentInflationMultiplier = eco.getInflationMultiplier();
    }

    /** Creates a lockup
     * @param _duration the time after lockup window closes that a user has to keep their funds locked up in order to receive yield
     * @param _rate the yield (based on inflationMultiplier at time of lockup creation) a depositor who waits the full duration will earn
     */
    function createLockup(
        uint256 _duration,
        uint256 _rate
    ) public onlyAuthorized {
        if (_rate > MAX_RATE) {
            revert BadRate();
        }
        if (_duration > MAX_DURATION || _duration < MIN_DURATION) {
            revert BadDuration();
        }

        Lockup storage lockup = lockups[nextId];
        lockup.rate = _rate;
        lockup.depositWindowEnd = getTime() + depositWindow;
        lockup.end = lockup.depositWindowEnd + _duration;

        emit LockupCreation(nextId, _duration, _rate);
        nextId += 1;
    }

    /** User deposits on their own behalf. Requires that the user has approved this contract
     * to transfer _amount of their eco.
     * @param _lockupId ID of the lockup being deposited to
     * @param _amount the amount being deposited
     */
    function deposit(uint256 _lockupId, uint256 _amount) public {
        _deposit(_lockupId, msg.sender, _amount);
    }

    /** User deposits on someone else's behalf. Requires that the beneficiary has approved this contract
     * to transfer _amount of their eco.
     * @param _lockupId ID of the lockup being deposited to
     * @param _beneficiary the person whose eco is being deposited
     * @param _amount the amount being deposited
     */
    function depositFor(
        uint256 _lockupId,
        address _beneficiary,
        uint256 _amount
    ) public {
        _deposit(_lockupId, _beneficiary, _amount);
    }

    function _deposit(
        uint256 _lockupId,
        address beneficiary,
        uint256 _amount
    ) internal {
        Lockup storage lockup = lockups[_lockupId];
        if (getTime() >= lockup.depositWindowEnd) {
            revert LateDeposit(_lockupId, msg.sender);
        }
        lockup.interest[msg.sender] += (_amount * lockup.rate) / BASE;
        uint256 gonsAmount = _amount * currentInflationMultiplier;
        lockup.gonsBalances[msg.sender] += gonsAmount;

        eco.transferFrom(msg.sender, address(this), _amount);
        eco.delegateAmount(eco.getPrimaryDelegate(beneficiary), _amount);
        emit LockupDeposit(_lockupId, beneficiary, gonsAmount);
    }

    /** User withdraws their own funds. Withdrawing before the lockup has ended will result in a
     * forfeiture of yield and penalty equal to that yield.
     * @param _lockupId the ID of the lockup being withdrawn from
     */
    function withdraw(uint256 _lockupId) public {
        _withdraw(_lockupId, msg.sender);
    }

    /** User withdraws recipient's funds to recipient. Reverts if withdrawn prior to lockup ending
     * @param _lockupId the ID of the lockup being withdrawn from
     * @param _recipient address to receive eco
     */
    function withdrawFor(uint256 _lockupId, address _recipient) public {
        _withdraw(_lockupId, _recipient);
    }

    function _withdraw(uint256 _lockupId, address _recipient) internal {
        Lockup storage lockup = lockups[_lockupId];
        uint256 amount = lockup.gonsBalances[_recipient] /
            currentInflationMultiplier;
        uint256 interest = lockup.interest[_recipient];

        eco.undelegateAmountFromAddress(
            eco.getPrimaryDelegate(_recipient),
            amount
        );
        if (getTime() < lockup.end) {
            if (msg.sender != _recipient) {
                revert EarlyWithdrawFor(_lockupId, msg.sender, _recipient);
            } else {
                amount -= interest;
                penalties += interest * currentInflationMultiplier;
            }
        } else {
            eco.mint(address(this), interest);
            amount += interest;
        }
        lockup.gonsBalances[_recipient] = 0;
        lockup.interest[_recipient] = 0;

        eco.transfer(_recipient, amount);
        emit LockupWithdrawal(
            _lockupId,
            _recipient,
            amount / currentInflationMultiplier
        );
    }

    /** getter function for gonsBalances
     * @param _lockupId the ID of the lockup
     * @param _who address whose gons balance is being fetched
     */
    function getGonsBalance(
        uint256 _lockupId,
        address _who
    ) public view returns (uint256 ecoAmount) {
        return lockups[_lockupId].gonsBalances[_who];
    }

    /** getter function for inflation-adjusted deposits
     * @param _lockupId the ID of the lockup
     * @param _who address whose balance is being fetched
     */
    function getBalance(
        uint256 _lockupId,
        address _who
    ) public view returns (uint256 ecoAmount) {
        return
            lockups[_lockupId].gonsBalances[_who] / currentInflationMultiplier;
    }

    /** getter function for yield
     * @param _lockupId the ID of the lockup
     * @param _who address whose balance is being fetched
     */
    function getYield(
        uint256 _lockupId,
        address _who
    ) public view returns (uint256 ecoAmount) {
        return lockups[_lockupId].interest[_who];
    }

    /** sweep accumulated penalty eco to a destination address
     * @param _destination the address that will receive
     */
    function sweep(address _destination) public onlyPolicy {
        eco.transfer(_destination, penalties / currentInflationMultiplier);
        penalties = 0;
    }

    // updates currentInflationMultiplier
    function updateInflationMultiplier() public {
        currentInflationMultiplier = eco.getInflationMultiplier();
    }
}
