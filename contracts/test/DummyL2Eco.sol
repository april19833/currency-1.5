// SPDX-License-Identifier: AGPL-3.0-only
//mock adapted from https://github.com/helix-foundation/WrappedEco/blob/main/src/test/mocks/MockEco.sol

pragma solidity ^0.8.13;

/* solhint-disable */

contract DummyL2Eco {
    // i.e. multiplier=1 would be a 1:1 ratio between underlying and external
    uint256 public constant MULTIPLIER_GRANULARITY = 1;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    uint256 private _totalSupply;
    string public name;
    string public symbol;
    uint256 public multiplier;
    uint256 public INITIAL_INFLATION_MULTIPLIER;

    constructor(string memory _name, string memory _symbol, uint256 _multiplier) {
        name = _name;
        symbol = _symbol;
        multiplier = _multiplier;
        INITIAL_INFLATION_MULTIPLIER = _multiplier;
    }

    function decimals() public pure returns (uint8) {
        return 18;
    }

    function applyMultiplier(uint256 value) private view returns (uint256) {
        return (value * MULTIPLIER_GRANULARITY) / multiplier;
    }

    function applyInverseMultiplier(uint256 value) private view returns (uint256) {
        return (value * multiplier) / MULTIPLIER_GRANULARITY;
    }

    function totalSupply() public view returns (uint256) {
        return applyMultiplier(_totalSupply);
    }

    function balanceOf(address account) public view returns (uint256) {
        return applyMultiplier(balances[account]);
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        uint256 underlyingAmount = applyInverseMultiplier(amount);

        uint256 senderBalance = balances[sender];
        require(senderBalance >= underlyingAmount, "ERC20: transfer amount exceeds balance");
        balances[sender] = senderBalance - underlyingAmount;
        balances[recipient] += underlyingAmount;
    }

    function transfer(address recipient, uint256 amount) public returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        allowances[owner][spender] = amount;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return allowances[owner][spender];
    }

    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = allowance(sender, msg.sender);
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        _approve(sender, msg.sender, currentAllowance - amount);

        return true;
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply += amount;
        balances[account] += amount;
    }

    function mint(address account, uint256 amount) public {
        _mint(account, applyInverseMultiplier(amount));
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");
        _totalSupply -= amount;
        balances[account] -= amount;
    }

    function burn(address account, uint256 amount) public {
        _burn(account, applyInverseMultiplier(amount));
    }

    function rebase(uint256 newMultiplier) external {
        multiplier = newMultiplier;
    }

    function linearInflationMultiplier() external view returns (uint256) {
        return multiplier;
    }
}