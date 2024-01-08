// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../policy/Policed.sol";
import "../../currency/ECOx.sol";
import "../../utils/TimeUtils.sol";
import "./CurrencyGovernance.sol";

/** @title TrustedNodes
 *
 * A registry of trusted nodes. Trusted nodes (trustees) are able to vote
 * on monetary policy and can only be added or removed using community
 * governance.
 *
 */
contract TrustedNodes is Policed, TimeUtils {
    uint256 public constant GENERATION_TIME = 14 days;

    uint256 public immutable termStart;

    uint256 public immutable termEnd;

    /** address with the currencyGovernance role */
    CurrencyGovernance public currencyGovernance;

    ECOx public immutable ecoX;

    mapping(address => uint256) public trusteeNumbers;

    address[] public trustees;

    /** voting record of each trustee
     */
    mapping(address => uint256) public votingRecord;

    /** timestamp of last withdrawal
     */
    mapping(address => uint256) private lastWithdrawals;

    /** reward earned per completed and revealed vote
     */
    uint256 public immutable voteReward;

    // error for functions gated only to the currency governance contract
    error GovernanceOnlyFunction();

    /** Redundant node trusting error
     * error for when an already trusted node tries to be trusted again
     * @param trusteeNumber the existing trustee number for the address
     */
    error NodeAlreadyTrusted(uint256 trusteeNumber);

    // error for when distrust is called but the address is already not trusted
    error DistrustNotTrusted();

    // error for when recordVote is called outside the trustee term
    error InactiveTerm();

    // error for when withdraw is called but no tokens have been earned to withdraw
    error WithdrawNoTokens();

    /** Event emitted when a node added to a list of trusted nodes.
     * @param trustee the trustee being added
     */
    event TrustedNodeAddition(address indexed trustee);

    /** Event emitted when a node removed from a list of trusted nodes
     * @param trustee the trustee being removed
     */
    event TrustedNodeRemoval(address indexed trustee);

    /** Event emitted when a node removed from a list of trusted nodes
     * @param trustee the trustee whose vote was recorded
     * @param newVotingRecord the new voting record for the trustee
     */
    event VoteRecorded(address indexed trustee, uint256 newVotingRecord);

    /** Event emitted when voting rewards are redeemed
     * @param recipient the address redeeming the rewards
     * @param amount the amount being redeemed
     */
    event VotingRewardRedemption(address indexed recipient, uint256 amount);

    /** Event emitted when the currencyGovernance role changes
     * @param newRoleHolder the new holder of the currencyGovernance role
     */
    event CurrencyGovernanceChanged(address newRoleHolder);

    modifier onlyCurrencyGovernance() {
        if (msg.sender != address(currencyGovernance)) {
            revert GovernanceOnlyFunction();
        }
        _;
    }

    /** Creates a new trusted node registry, populated with some initial nodes
     * @param _policy the address of the root policy contract
     * @param _currencyGovernance the address of the currencyGovernance contract
     * @param _ecoX the address of the EcoX contract
     * @param _termStart the start time of the trustee term
     * @param _termLength the length of the trustee term
     * @param _voteReward the reward awarded to a trustee for each successfully revealed vote
     * @param _initialTrustees the initial cohort of trustees
     */
    constructor(
        Policy _policy,
        CurrencyGovernance _currencyGovernance,
        ECOx _ecoX,
        uint256 _termStart,
        uint256 _termLength,
        uint256 _voteReward,
        address[] memory _initialTrustees
    ) Policed(_policy) {
        currencyGovernance = _currencyGovernance;
        ecoX = _ecoX;
        termStart = _termStart;
        termEnd = termStart + _termLength;
        voteReward = _voteReward;
        uint256 _numTrustees = _initialTrustees.length;
        for (uint256 i = 0; i < _numTrustees; i++) {
            _trust(_initialTrustees[i]);
        }
    }

    function getTrustees() public view returns (address[] memory _trustees) {
        return trustees;
    }

    /** Fetches the date of a trustee's last withdrawal
     * @param trustee the trustee whose last withdrawal date is being fetched
     */
    function getLastWithdrawal(
        address trustee
    ) internal view returns (uint256 time) {
        return termEnd + lastWithdrawals[trustee];
    }

    /** Changes the holder currencyGovernance role
     * @param _currencyGovernance the new currencyGovernance role holder
     */
    function updateCurrencyGovernance(
        CurrencyGovernance _currencyGovernance
    ) public onlyPolicy {
        currencyGovernance = _currencyGovernance;
        emit CurrencyGovernanceChanged(address(_currencyGovernance));
    }

    /** Grant trust to a node.
     *
     * The node is pushed to trustedNodes array.
     *
     * @param _node The node to start trusting.
     */
    function trust(address _node) external onlyPolicy {
        _trust(_node);
    }

    /** Helper for trust
     * @param _node The node to start trusting
     */
    function _trust(address _node) internal {
        if (isTrusted(_node)) {
            revert NodeAlreadyTrusted(trusteeNumbers[_node]);
        }
        trustees.push(_node);
        trusteeNumbers[_node] = trustees.length;
        emit TrustedNodeAddition(_node);
    }

    /** Removes a trustee from the set
     * Node to distrust swaped to be a last element in the trustedNodes, then deleted
     * @param _node The trustee to be removed
     */
    function distrust(address _node) external onlyPolicy {
        if (!isTrusted(_node)) {
            revert DistrustNotTrusted();
        }

        uint256 lastIndex = trustees.length - 1;
        uint256 trusteeIndex = trusteeNumbers[_node] - 1;
        if (trusteeIndex != lastIndex) {
            address lastNode = trustees[lastIndex];
            trustees[trusteeIndex] = lastNode;
            trusteeNumbers[lastNode] = trusteeIndex + 1;
        }
        delete trusteeNumbers[_node];
        trustees.pop();
        emit TrustedNodeRemoval(_node);
    }

    /** Incements the counter when the trustee reveals their vote
     * @param _who address whose vote is being recorded
     */
    function recordVote(address _who) external onlyCurrencyGovernance {
        uint256 time = getTime();
        if (time < termEnd && time > termStart) {
            votingRecord[_who]++;
            emit VoteRecorded(_who, votingRecord[_who]);
        } else {
            revert InactiveTerm();
        }
    }

    /** Return the number of entries in trustedNodes array.
     */
    function numTrustees() external view returns (uint256) {
        return trustees.length;
    }

    /** Checks if a node address is trusted in the current cohort
     * @param _node the address whose trustee status we want to check
     */
    function isTrusted(address _node) public view returns (bool) {
        return trusteeNumbers[_node] > 0;
    }

    /** withdraws everything that can be withdrawn
     */
    function withdraw() public {
        uint256 numWithdrawals = calculateWithdrawal(msg.sender);
        if (numWithdrawals == 0) {
            revert WithdrawNoTokens();
        }
        uint256 toWithdraw = numWithdrawals * voteReward;
        lastWithdrawals[msg.sender] += numWithdrawals * GENERATION_TIME;
        votingRecord[msg.sender] -= numWithdrawals;

        if (!ecoX.transfer(msg.sender, toWithdraw)) {
            revert ECOx.TransferFailed();
        }
        emit VotingRewardRedemption(msg.sender, toWithdraw);
    }

    /** returns the amount of tokens that are currently withdrawable
     */
    function currentlyWithdrawable() public view returns (uint256 amount) {
        return voteReward * calculateWithdrawal(msg.sender);
    }

    /** helper for withdraw
     */
    function calculateWithdrawal(
        address withdrawer
    ) internal view returns (uint256 amount) {
        uint256 timeNow = getTime();
        if (timeNow < termEnd) {
            return 0;
        }

        uint256 lastWithdrawal = getLastWithdrawal(withdrawer);
        uint256 limit = (timeNow - lastWithdrawal) / GENERATION_TIME;
        uint256 numWithdrawals = limit > votingRecord[withdrawer]
            ? votingRecord[withdrawer]
            : limit;
        return numWithdrawals;
    }

    /** returns the number of tokens the sender is currently entitled to
     * which they will be able to withdraw upon vesting
     */
    function fullyVested()
        public
        view
        returns (uint256 amount, uint256 timestamp)
    {
        uint256 record = votingRecord[msg.sender];
        return (record * voteReward, termEnd + record * GENERATION_TIME);
    }

    /** drains all the ECOx in TrustedNodes to a recipient address
     * @param recipient the address to receive the ECOx
     */
    function sweep(address recipient, uint256 amount) public onlyPolicy {
        if (!ecoX.transfer(recipient, amount)) {
            revert ECOx.TransferFailed();
        }
    }
}
