/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// TODO: make an interface for delegation

interface IECO is IERC20 {
    /**
     * Only available to minters
     * @param to the address to mint to
     * @param amount the amount to mint
     */
    function mint(address to, uint256 amount) external;

    /**
     * Only available to token holders for their own tokens and burners
     * @param from the address to burn from
     * @param amount the amount to burn
     */
    function burn(address from, uint256 amount) external;

    /**
     * Returns the votes for the current snapshot
     * @param account the address whose vote balance to check
     * @return balance the balance of the account at the time of the Snapshot
     */
    function voteBalanceSnapshot(
        address account
    ) external view returns (uint256 balance);

    /**
     * Returns the inflation multiplier value for the current snapshot
     * @return multiplier inflation multipler value
     */
    function inflationMultiplierSnapshot()
        external
        view
        returns (uint256 multiplier);

    /**
     *  Returns the total supply for the current snapshot
     * @return total total supply of the current snapshot
     */
    function totalSupplySnapshot() external view returns (uint256 total);
}
