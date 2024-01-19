pragma solidity ^0.8.0;

import "@eth-optimism/contracts/L1/messaging/IL1ERC20Bridge.sol";
import "../../utils/TimeUtils.sol";
import "@openzeppelin/token/ERC20/IERC20.sol";
import "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";


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
        //length in seconds
        uint256 length;
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
    address public leverContractL1;

    //address of L2 treasury
    address public treasuryL2;

    //ECO token ON L2
    IECO public immutable eco;

    //messenger contract on OP
    ICrossDomainMessenger public immutable messengerL2;

    //mapping of lockup id to lockup
    mapping(uint256 => Lockup) public lockups;

    /////////// CONTRACT EVENTS ///////////
    event LockupDeposit(uint256 indexed lockupId, address indexed beneficiary, uint256 amount);

    event NewLockup(
        uint256 indexed lockupId,
        uint256 rate,
        uint256 window,
        uint256 length,
        uint256 totalRewards
    );

    /////////// CONTRACT MODIFIERS ///////////

    modifier onlyleverContractL1() {
            require(msg.sender == address(messengerL2), "OVM_XCHAIN: messenger contract unauthenticated");

            require(
                messengerL2.xDomainMessageSender() == leverContractL1,
                "OVM_XCHAIN: wrong price setter of cross-domain message"
            );

            _;
    }
    
    /////////// CONTRACT CONSTRUCTOR ///////////

    constructor(
        address _eco,
        address _messengerL2,
        address _leverContractL1
    ) {
        eco = IECO(_eco);
        messengerL2 = ICrossDomainMessenger(_messengerL2);
        leverContractL1 = _leverContractL1;
    }

    /////////// CONTRACT FUNCTIONS ///////////

    function newLockup(
        uint256 _rate,
        uint256 _window,
        uint256 _length,
        uint256 _totalRewards
    ) external onlyleverContractL1() {
        Lockup storage lockup = lockups[lockupCounter];
        uint256 currentTime = getTime();
        lockup.rate = _rate;
        lockup.cutoff = currentTime + _window;
        lockup.length = _length;
        lockup.rewardsRemaining = _totalRewards * eco.linearInflationMultiplier();

        emit NewLockup(lockupCounter, _rate, _window, _length, _totalRewards);

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
        require(lockup.cutoff > getTime(), "Lockup period has ended");
        require(lockup.rewardsRemaining - _amount >= 0, "Not enough rewards remaining");

        eco.transferFrom(_beneficiary, address(this), _amount);

        uint256 _gonsAmount = _amount * eco.linearInflationMultiplier();

        uint256 _gonsInterest = (_gonsAmount * lockup.rate) / BASE;

        lockup.rewardsRemaining -= _gonsInterest;

        Deposit memory deposit = Deposit({
            gons: _gonsAmount,
            end: getTime() + lockup.length
        });

        lockup.deposits[_beneficiary].push(deposit);

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
                    lockup.rewardsRemaining += _gonsInterest;
                }
            }
        } else {
             _gonsAmount = _gonsAmount + _gonsInterest;
             eco.transfer(_beneficiary, _gonsAmount / _multiplier);
        }
        //delete the lockupIndex from the deposits array
        uint256 lastIndex = lockup.deposits[_beneficiary].length - 1;
        if (lockupIndex != lastIndex) {
            Deposit storage lastDeposit = lockup.deposits[_beneficiary][lastIndex];
            lockup.deposits[_beneficiary][lockupIndex] = lastDeposit;
        }
        delete lockup.deposits[_beneficiary][lastIndex];
        lockup.deposits[_beneficiary].pop();
    }

    function sweep(uint256 _lockupId) external {
        Lockup storage lockup = lockups[_lockupId];
        require(getTime() < lockup.cutoff, "Lockup period has not ended");
        uint256 _rewardsRemaining = lockup.rewardsRemaining;
        lockup.rewardsRemaining = 0;
        eco.transfer(treasuryL2, _rewardsRemaining / eco.linearInflationMultiplier());
    }

    //get Lockup information minus deposits
    function getLockup(uint256 _lockupId) external view returns (uint256, uint256, uint256, uint256) {
        Lockup storage lockup = lockups[_lockupId];
        return (lockup.rate, lockup.cutoff, lockup.length, lockup.rewardsRemaining);
    }

    //get deposits array for beneficiary
    function getDeposits(uint256 _lockupId, address _beneficiary) external view returns (Deposit[] memory) {
        Lockup storage lockup = lockups[_lockupId];
        return lockup.deposits[_beneficiary];
    }

    //get deposit information for beneficiary
    function getDeposit(uint256 _lockupId, address _beneficiary, uint256 lockupIndex) external view returns (uint256, uint256) {
        Lockup storage lockup = lockups[_lockupId];
        Deposit storage userDeposit = lockup.deposits[_beneficiary][lockupIndex];
        return (userDeposit.gons, userDeposit.end);
    }

}