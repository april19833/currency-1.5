/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// TODO: make an interface for delegation

interface IECO is IERC20 {
    /**
     * @dev Only available to minters
     * @param to the address to mint to
     * @param amount the amount to mint
     */
    function mint(address to, uint256 amount) external;

    /**
     * @dev Only available to token holders for their own tokens and burners
     * @param from the address to burn from
     * @param amount the amount to burn
     */
    function burn(address from, uint256 amount) external;

    /**
     * @dev Returns the votes for the current snapshot
     * @param account the address whose vote balance to check
     * @return the balance of the account at the time of the Snapshot
     */
    function voteBalanceSnapshot(
        address account
    ) external view returns (uint256);

    /**
     * @dev Returns the inflation multiplier value for the current snapshot
     * @return inflation multipler value
     */
    function inflationMultiplierSnapshot() external view returns (uint256);

    /**
     * @dev  Returns the total supply for the current snapshot
     * @return total supply of the current snapshot
     */
    function totalSupplySnapshot() external view returns (uint256);
}
