pragma solidity ^0.8.0;

import "../monetary/Lever.sol";
import "../../currency/ECO.sol";
import "@eth-optimism/contracts/L1/messaging/IL1ERC20Bridge.sol";
import "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";
import "../../policy/Policy.sol";

interface ILeverContractL2 {
    function newLockup(
        uint256 _rate,
        uint256 _window,
        uint256 _length,
        uint256 _totalRewards
    ) external;
}

contract FixedLockupL1 is Lever {

ICrossDomainMessenger public immutable messengerL1;

IL1ERC20Bridge public immutable ecoBridge;

ECO public immutable eco;

address public immutable ecoL2;

ILeverContractL2 public immutable leverContractL2;

event NewLockup(
    uint256 rate,
    uint256 window,
    uint256 length,
    uint256 totalRewards
);

constructor(
    address _monetaryPolicyAdapter,
    address _eco,
    address _ecoL2,
    address _messengerL1,
    Policy _policy,
    address _ecoBridge,
    ILeverContractL2 _leverContractL2) 
    Lever( _policy) {
        authorized[_monetaryPolicyAdapter] = true;
        eco = ECO(_eco);
        ecoL2 = _ecoL2;
        messengerL1 = ICrossDomainMessenger(_messengerL1);
        ecoBridge = IL1ERC20Bridge(_ecoBridge);
        leverContractL2 = _leverContractL2;
    }

    function newLockup(
        uint256 _rate,
        uint256 _window,
        uint256 _length,
        uint256 _totalRewards,
        uint32 _l2GasMessage,
        uint32 _l2GasBridge
    ) external  virtual onlyAuthorized(){
        bytes memory message = abi.encodeWithSelector(
            ILeverContractL2.newLockup.selector,
            _rate,
            _window,
            _length,
            _totalRewards
        );
        messengerL1.sendMessage(address(leverContractL2), message, _l2GasMessage);

        eco.mint(address(this), _totalRewards);

        eco.approve(address(ecoBridge), _totalRewards);

        ecoBridge.depositERC20To(
            address(eco),
            ecoL2,
            address(leverContractL2),
            _totalRewards,
            _l2GasBridge,
            bytes("")
            );

        emit NewLockup(_rate, _window, _length, _totalRewards);
    }

    function burnReserves() external virtual{
        uint256 balance = eco.balanceOf(address(this));
        eco.burn(address(this), balance);
    }
    
}