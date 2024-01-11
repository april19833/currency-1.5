/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// TODO: make an interface for delegation

interface IECO is IERC20 {
    /**
     * Only available to minters
     */
    function mint(address to, uint256 amount) external;

    /**
     * Only available to token holders for their own tokens and burners
     */
    function burn(address from, uint256 amount) external;

    /**
     * Returns the votes for the current snapshot
     *
     * @param account the address whose vote balance to check
     */
    function voteBalanceSnapshot(
        address account
    ) external view returns (uint256);

    /**
     * Returns the inflation multiplier value for the current snapshot
     */
    function inflationMultiplierSnapshot() external view returns (uint256);

    /**
     * Returns the total supply for the current snapshot
     */
    function totalSupplySnapshot() external view returns (uint256);

    /**
     * Enables voting with your ECO balance, but will transaction cost
     */
    function enableVoting() external;

    /**
     * Allows others to delegate voting power to you
     * Disallows you from delegating your voting power to others
     */
    function enableDelegationTo() external;

    /**
     * Disallows others from delegating to you
     * Does not change your ability to delegate to others
     */
    function disableDelegationTo() external;

    /**
     * Allows others to delegate to you
     * Disallows you from delegating to others
     */
    function reenableDelegating() external;

    /** 
     * Returns true if the address has no amount of their balance delegated, otherwise false
     * @param account the address whose delegation status is being checked
     */
    function isOwnDelegate(address account) external returns (bool);

    /**
     * Fetches the primary address `account` is currently delegating to. Defaults to the account address itself if none specified.
     * The primary delegate is the one that is delegated any new funds the address recieves
     * @param account the address whose primary delegate is being fetched
     */
     function getPrimaryDelegate(address account) external view returns (address);

    /**
     * Delegates all votes from the sender to `delegatee`
     * This function assumes that you do not have partial delegations
     * It will revert with "ERC20Delegated: must have an undelegated amount available to cover delegation" if you do
     * @param delegatee the address being delegated to
     */
    function delegate(address delegatee) external;

    /**
     * Delegates all votes from the sender to `delegatee`
     * This function assumes that you do not have partial delegations
     * It will revert with "ERC20Delegated: must have an undelegated amount available to cover delegation" if you do
     * @param delegator the address delegating votes
     * @param delegatee the address being delegated to
     * @param deadline the time at which the signature expires
     * @param v signature value
     * @param r signature value
     * @param s signature value
     */
    function delegateBySig(address delegator, address delegatee, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;

    /**
     * Delegate an `amount` of votes from the sender to `delegatee`
     * @param delegatee the address being delegated to
     * @param amount the amount of tokens being allocated
     */
    function delegateAmount(address delegatee, uint256 amount) external;

    /**
     * Undelegate all votes from the sender's primary delegate
     */
    function undelegate() external;

    /**
     * Allows a primary delegated individual to revoke delegations of unwanted delegators
     * Useful for allowing yourself to call reenableDelegating after calling disableDelegationTo
     * @param delegator the address whose delegation is being revoked
     */
    function revokeDelegation(address delegator) external;

    /**
     * Undelegate a specific amount of votes from the `delegatee` back to the sender
     * @param delegatee the address being undelegated to
     * @param amount the amount of tokens being undelegated
     */
    function undelegateAmountFromAddress(address delegatee, uint256 amount) external;

    /**
     * See {IERC20-balanceOf}.
     * @param account the address whose vote balance is being checked
     */
    function voteBalanceOf(address account) external view returns (uint256)
}
