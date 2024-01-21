// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Proposal
 * @notice Interface specification for proposals. Any proposal submitted in the
 * policy decision process must implement this interface.
 */
interface Proposal {
    /**
     * The name of the proposal.
     *
     * This should be relatively unique and descriptive.
     * @return name The name of the proposal
     */
    function name() external view returns (string memory name);

    /**
     * A longer description of what this proposal achieves.
     * @return description A longer description of what this proposal achieves.
     */
    function description() external view returns (string memory description);

    /**
     * A URL where voters can go to see the case in favour of this proposal,
     * and learn more about it.
     * @return url A URL where voters can go to see the case in favour of this proposal
     */
    function url() external view returns (string memory url);

    /**
     * Called to enact the proposal.
     *
     * This will be called from the root policy contract using delegatecall,
     * with the direct proposal address passed in as _self so that storage
     * data can be accessed if needed.
     *
     * @param _self The address of the proposal contract.
     */
    function enacted(address _self) external;
}
