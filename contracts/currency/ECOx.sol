/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./IECO.sol";
import "../policy/Policed.sol";
import "./ERC20Pausable.sol";

/** @title An ERC20 token interface for ECOx
 *
 * Contains the conversion mechanism for turning ECOx into ECO.
 */
contract ECOx is ERC20Pausable, Policed {
    // bits of precision used in the exponentiation approximation
    uint8 public constant PRECISION_BITS = 100;

    uint256 public immutable initialSupply;

    // the address of the contract for initial distribution
    address public immutable distributor;

    // the address of the ECO token contract
    IECO public immutable ecoToken;

    // error for when transfer returns false
    // used by contracts that import this contract
    error TransferFailed();

    constructor(
        Policy _policy,
        address _distributor,
        uint256 _initialSupply,
        IECO _ecoAddr,
        address _initialPauser
    )
        ERC20Pausable("ECOx", "ECOx", address(_policy), _initialPauser)
        Policed(_policy)
    {
        require(_initialSupply > 0, "initial supply not properly set");
        require(
            address(_ecoAddr) != address(0),
            "Do not set the ECO address as the zero address"
        );

        initialSupply = _initialSupply;
        distributor = _distributor;
        ecoToken = _ecoAddr;
    }

    function initialize(
        address _self
    ) public virtual override onlyConstruction {
        super.initialize(_self);
        pauser = ERC20Pausable(_self).pauser();
        _mint(distributor, initialSupply);
    }

    function ecoValueOf(uint256 _ecoXValue) public view returns (uint256) {
        uint256 _ecoSupply = ecoToken.totalSupply();

        return computeValue(_ecoXValue, _ecoSupply);
    }

    function valueAt(
        uint256 _ecoXValue,
        uint256 _blockNumber
    ) public view returns (uint256) {
        uint256 _ecoSupplyAt = ecoToken.totalSupplyAt(_blockNumber);

        return computeValue(_ecoXValue, _ecoSupplyAt);
    }

    function computeValue(
        uint256 _ecoXValue,
        uint256 _ecoSupply
    ) internal view returns (uint256) {
        uint256 _preciseRatio = safeLeftShift(_ecoXValue, PRECISION_BITS) /
            initialSupply;

        return
            (generalExp(_preciseRatio, PRECISION_BITS) * _ecoSupply) >>
            PRECISION_BITS;
    }

    function safeLeftShift(
        uint256 value,
        uint8 shift
    ) internal pure returns (uint256) {
        uint256 _result = value << shift;
        require(
            _result >> shift == value,
            "value too large, shift out of bounds"
        );
        return _result;
    }

    /**
     * @dev this function can be auto-generated by the script 'PrintFunctionGeneralExp.py'.
     * it approximates "e ^ x" via maclaurin summation: "(x^0)/0! + (x^1)/1! + ... + (x^n)/n!".
     * it returns "e ^ (x / 2 ^ precision) * 2 ^ precision", that is, the result is upshifted for accuracy.
     * the global "maxExpArray" maps each "precision" to "((maximumExponent + 1) << (MAX_PRECISION - precision)) - 1".
     * the maximum permitted value for "x" is therefore given by "maxExpArray[precision] >> (MAX_PRECISION - precision)".
     */
    function generalExp(
        uint256 _x,
        uint8 _precision
    ) internal pure returns (uint256) {
        uint256 xi = _x;
        uint256 res = 0;

        xi = (xi * _x) >> _precision;
        res += xi * 0x3442c4e6074a82f1797f72ac0000000; // add x^02 * (33! / 02!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x116b96f757c380fb287fd0e40000000; // add x^03 * (33! / 03!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x045ae5bdd5f0e03eca1ff4390000000; // add x^04 * (33! / 04!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x00defabf91302cd95b9ffda50000000; // add x^05 * (33! / 05!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x002529ca9832b22439efff9b8000000; // add x^06 * (33! / 06!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x00054f1cf12bd04e516b6da88000000; // add x^07 * (33! / 07!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000a9e39e257a09ca2d6db51000000; // add x^08 * (33! / 08!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x000012e066e7b839fa050c309000000; // add x^09 * (33! / 09!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x000001e33d7d926c329a1ad1a800000; // add x^10 * (33! / 10!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000002bee513bdb4a6b19b5f800000; // add x^11 * (33! / 11!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x00000003a9316fa79b88eccf2a00000; // add x^12 * (33! / 12!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000000048177ebe1fa812375200000; // add x^13 * (33! / 13!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000000005263fe90242dcbacf00000; // add x^14 * (33! / 14!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x000000000057e22099c030d94100000; // add x^15 * (33! / 15!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000000000057e22099c030d9410000; // add x^16 * (33! / 16!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x00000000000052b6b54569976310000; // add x^17 * (33! / 17!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x00000000000004985f67696bf748000; // add x^18 * (33! / 18!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x000000000000003dea12ea99e498000; // add x^19 * (33! / 19!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x00000000000000031880f2214b6e000; // add x^20 * (33! / 20!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x000000000000000025bcff56eb36000; // add x^21 * (33! / 21!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x000000000000000001b722e10ab1000; // add x^22 * (33! / 22!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000000000000000001317c70077000; // add x^23 * (33! / 23!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x00000000000000000000cba84aafa00; // add x^24 * (33! / 24!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x00000000000000000000082573a0a00; // add x^25 * (33! / 25!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x00000000000000000000005035ad900; // add x^26 * (33! / 26!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x000000000000000000000002f881b00; // add x^27 * (33! / 27!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000000000000000000000001b29340; // add x^28 * (33! / 28!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x00000000000000000000000000efc40; // add x^29 * (33! / 29!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000000000000000000000000007fe0; // add x^30 * (33! / 30!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000000000000000000000000000420; // add x^31 * (33! / 31!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000000000000000000000000000021; // add x^32 * (33! / 32!)
        xi = (xi * _x) >> _precision;
        res += xi * 0x0000000000000000000000000000001; // add x^33 * (33! / 33!)

        return res / 0x688589cc0e9505e2f2fee5580000000 + _x; // divide by 33! and then add x^1 / 1! + x^0 / 0!
    }

    function exchange(uint256 _ecoXValue) external {
        uint256 eco = ecoValueOf(_ecoXValue);

        _burn(msg.sender, _ecoXValue);

        ecoToken.mint(msg.sender, eco);
    }

    function mint(address _to, uint256 _value) external {
        _mint(_to, _value);
    }
}
