pragma solidity ^0.8.0;

import "@eth-optimism/contracts/L1/messaging/IL1ERC20Bridge.sol";
import "@eth-optimism/contracts/L2/messaging/IL2ERC20Bridge.sol";
import "../../utils/TimeUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";
import {console} from "node_modules/hardhat/console.sol";

interface IECO is IERC20 {
    function linearInflationMultiplier() external view returns (uint256);
}

contract FixedLockupL2 is TimeUtils{

    /////////// CONTRACT VARIABLES ///////////

    struct Lockup {
        //rate relative to base
        uint256 rate;
        //cutoff in blocktime
        uint256 cutoff;
        //duration in seconds
        uint256 duration;
        //gons total rewards remaining
        uint256 rewardsRemaining;
        //mapping of address to deposits array per address
        mapping(address => Deposit[]) deposits;
    }

    struct Deposit{
        //deposit amount in gons
        uint256 gons;
        //deposit end time
        uint256 end;
    }

    //base for rate
    uint256 internal constant BASE = 1e18;

    //counter for lockups
    uint256 public lockupCounter;
    
    //address of lever contract on L1
    address public l1Contract;

    //address of L2 treasury
    IL2ERC20Bridge immutable public l2Bridge;

    //ECO token ON L2
    IECO public immutable eco;

    //messenger contract on OP
    ICrossDomainMessenger public immutable messenger;

    //mapping of lockup id to lockup
    mapping(uint256 => Lockup) public lockups;

    /////////// CONTRACT EVENTS ///////////
    event LockupDeposit(uint256 indexed lockupId, address indexed beneficiary, uint256 amount);

    event LockupWithdraw(uint256 indexed lockupId, address indexed beneficiary, uint256 lockupIndex ,uint256 amount);

    event NewLockup(
        uint256 indexed lockupId,
        uint256 rate,
        uint256 window,
        uint256 duration,
        uint256 totalRewards
    );

    event LockupSweep(uint256 indexed lockupId, uint256 amount);

    /////////// CONTRACT MODIFIERS ///////////

    modifier onlyl1Contract() {
            require(msg.sender == address(messenger), "OVM_XCHAIN: messenger contract unauthenticated");

            require(
                messenger.xDomainMessageSender() == l1Contract,
                "OVM_XCHAIN: wrong sender of cross-domain message"
            );

            _;
    }
    
    /////////// CONTRACT CONSTRUCTOR ///////////

    constructor(
        address _eco,
        address _messenger,
        address _l1Contract,
        address _l2Bridge
    ) {
        eco = IECO(_eco);
        messenger = ICrossDomainMessenger(_messenger);
        l1Contract = _l1Contract;
        l2Bridge = IL2ERC20Bridge(_l2Bridge);
    }

    /////////// CONTRACT FUNCTIONS ///////////

    function newLockup(
        uint256 _rate,
        uint256 _window,
        uint256 _duration,
        uint256 _totalRewards
    ) external onlyl1Contract() {
        Lockup storage lockup = lockups[lockupCounter];
        uint256 currentTime = getTime();
        lockup.rate = _rate;
        lockup.cutoff = currentTime + _window;
        lockup.duration = _duration;
        lockup.rewardsRemaining = _totalRewards * eco.linearInflationMultiplier();

        emit NewLockup(lockupCounter, _rate, _window, _duration, _totalRewards);

        lockupCounter++;
    }

    function deposit(uint256 _lockupId, uint256 _amount) external {
        _deposit(_lockupId, msg.sender, _amount);
    }

    function depositFor(
        uint256 _lockupId,
        address _beneficiary,
        uint256 _amount
    ) external {
        _deposit(_lockupId, _beneficiary, _amount);
    }

    function _deposit(uint256 _lockupId, address _beneficiary, uint256 _amount) internal {
        Lockup storage lockup = lockups[_lockupId];
        uint256 _gonsAmount = _amount * eco.linearInflationMultiplier();
        uint256 _gonsInterest = (_gonsAmount * lockup.rate) / BASE;

        require(lockup.cutoff > getTime(), "Lockup period has ended");
        require(lockup.rewardsRemaining >= _gonsInterest, "Not enough rewards remaining");

        eco.transferFrom(_beneficiary, address(this), _amount);

        lockup.rewardsRemaining -= _gonsInterest;

        Deposit memory userDeposit = Deposit({
            gons: _gonsAmount,
            end: getTime() + lockup.duration
        });

        lockup.deposits[_beneficiary].push(userDeposit);

        emit LockupDeposit(_lockupId, _beneficiary, _gonsAmount);

    }

    function withdraw(uint256 _lockupId, uint256 lockupIndex) external {
        _withdraw(_lockupId, msg.sender, lockupIndex);
    }

    function withdrawFor(uint256 _lockupId, address _beneficiary,  uint256 lockupIndex) external {
        _withdraw(_lockupId, _beneficiary, lockupIndex);
    }

    function _withdraw(uint256 _lockupId, address _beneficiary, uint256 lockupIndex) internal {
        //get lockup
        Lockup storage lockup = lockups[_lockupId];
        //get specific deposit
        Deposit storage userDeposit = lockup.deposits[_beneficiary][lockupIndex];
        //get rate
        uint256 _rate = lockup.rate;
        //get gons
        uint256 _gonsAmount = userDeposit.gons;
        //get end
        uint256 _end = userDeposit.end;
        //get gons interest
        uint256 _gonsInterest = (_gonsAmount * _rate) / BASE;
        //get current eco multiplier
        uint256 _multiplier = eco.linearInflationMultiplier();
        

        if (getTime() < _end){
            if (msg.sender != _beneficiary){
                revert("Cannot withdraw on behalf before lockup period has ended");
            } else {
                if (_gonsAmount>_gonsInterest){
                    _gonsAmount = _gonsAmount - _gonsInterest;
                    eco.transfer(_beneficiary, _gonsAmount / _multiplier);
                    lockup.rewardsRemaining += (_gonsInterest * 2);
                }
                else{
                    lockup.rewardsRemaining += _gonsAmount+_gonsInterest;
                }
            }
        } else {
             _gonsAmount = _gonsAmount + _gonsInterest;
             eco.transfer(_beneficiary, _gonsAmount / _multiplier);
        }
        emit LockupWithdraw(_lockupId, _beneficiary, lockupIndex,_gonsAmount);
        //delete the lockupIndex from the deposits array
        uint256 lastIndex = lockup.deposits[_beneficiary].length - 1;
        if (lockupIndex != lastIndex) {
            Deposit storage lastDeposit = lockup.deposits[_beneficiary][lastIndex];
            lockup.deposits[_beneficiary][lockupIndex] = lastDeposit;
        }
        delete lockup.deposits[_beneficiary][lastIndex];
        lockup.deposits[_beneficiary].pop();
    }

    function sweep(uint256 _lockupId, uint32 _l1Gas) external {

        //ADD BURN CONTRACT
        Lockup storage lockup = lockups[_lockupId];
        require(getTime() > lockup.cutoff, "Lockup period has not ended");
        uint256 _rewardsRemaining = lockup.rewardsRemaining;
        eco.approve(address(l2Bridge), _rewardsRemaining / eco.linearInflationMultiplier());
        l2Bridge.withdrawTo(address(eco), l1Contract, _rewardsRemaining / eco.linearInflationMultiplier(), _l1Gas, bytes(""));
        emit LockupSweep(_lockupId, _rewardsRemaining);
        lockup.rewardsRemaining = 0;
    }

    //get Lockup information minus deposits
    function getLockup(uint256 _lockupId) external view returns (uint256, uint256, uint256, uint256) {
        Lockup storage lockup = lockups[_lockupId];
        return (lockup.rate, lockup.cutoff, lockup.duration, lockup.rewardsRemaining);
    }

    //get deposits array for beneficiary
    function getDeposits(uint256 _lockupId, address _beneficiary) external view returns (Deposit[] memory) {
        Lockup storage lockup = lockups[_lockupId];
        return lockup.deposits[_beneficiary];
    }

    //get deposit information for beneficiary
    function getDeposit(uint256 _lockupId, address _beneficiary, uint256 lockupIndex) external view returns (Deposit memory) {
        Lockup storage lockup = lockups[_lockupId];
        Deposit storage userDeposit = lockup.deposits[_beneficiary][lockupIndex];
        return userDeposit;
    }

}