// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../policy/Policed.sol";
import "../../currency/ECOx.sol";
import "../../utils/TimeUtils.sol";

// temp trusted nodes until merging

/** @title TrustedNodes
 *
 * A registry of trusted nodes. Trusted nodes are able to vote during
 * inflation/deflation votes, and can only be added or removed using policy
 * proposals.
 *
 */
contract TrustedNodes is Policed, TimeUtils {
    uint256 public constant generationTime = 14 days;

    uint256 public termEndTimestamp;

    // address with the policy role
    address policyRole;

    // address with the trusteeGovernance role
    address trusteeGovernanceRole;

    address public hoard;

    address public EcoXAddress;

    mapping(address => uint256) trusteeNumbers;

    address[] trustees;

    address[] removedTrustees;

    /** Represents the number of votes for which the trustee can claim rewards.
    Increments each time the trustee votes, set to zero upon redemption */
    mapping(address => uint256) public votingRecord;

    // last year's voting record
    mapping(address => uint256) public lastYearVotingRecord;    

    // completely vested
    mapping(address => uint256) public fullyVestedRewards;

    // timestamp of last withdrawal
    mapping(address => uint256) public lastWithdrawals;

    /** reward earned per completed and revealed vote */
    uint256 public voteReward;

    // unallocated rewards to be sent to hoard upon the end of the year term
    uint256 public unallocatedRewardsCount;

    /** Event emitted when a node added to a list of trusted nodes.
     */
    event TrustedNodeAddition(address indexed node);

    /** Event emitted when a node removed from a list of trusted nodes
     */
    event TrustedNodeRemoval(address indexed node);

    /** Event emitted when voting rewards are redeemed */
    event VotingRewardRedemption(address indexed recipient, uint256 amount);

    // Event emitted on annualUpdate and newCohort to request funding to the contract
    event FundingRequest(uint256 amount);

    // information for the new trustee rewards term
    event RewardsTrackingUpdate(
        uint256 nextUpdateTimestamp,
        uint256 newRewardsCount
    );

    modifier onlyTrusteeGovernance() {
        require(
            msg.sender == trusteeGovernanceRole,
            "only TrusteeGovernance has permission to call this method"
        );
        _;
    }

    /** Creates a new trusted node registry, populated with some initial nodes.
     */
    constructor(
        Policy _policy,
        address[] memory _initialTrustedNodes,
        uint256 _voteReward
    ) Policed(_policy) {
        voteReward = _voteReward;
        hoard = address(_policy);
        uint256 numTrustees = _initialTrustedNodes.length;
        for (uint256 i = 0; i < numTrustees; i++) {
            _trust(_initialTrustedNodes[i]);
        }
    }

    // function getTrustedNodesFromCohort(uint256 _cohort)
    //     public
    //     view
    //     returns (address[] memory)
    // {
    //     return cohorts[_cohort].trustedNodes;
    // }

    /** Grant trust to a node.
     *
     * The node is pushed to trustedNodes array.
     *
     * @param _node The node to start trusting.
     */
    function trust(address _node) external onlyPolicy {
        _trust(_node);
    }

    /** helper for trust
     * @param _node The node to start trusting.
     */
    function _trust(address _node) internal {
        trustees.push(_node);
        trusteeNumbers[_node] = trustees.length;
        emit TrustedNodeAddition(_node);
    }

    /** Stop trusting a node.
     *
     * Node to distrust swaped to be a last element in the trustedNodes, then deleted
     *
     * @param _node The node to stop trusting.
     */
    function distrust(address _node) external onlyPolicy {
        require(isTrusted(_node), "Node already not trusted");

        uint256 lastIndex = trustees.length - 1;
        uint256 trusteeIndex = trusteeNumbers[_node] - 1;
        if (trusteeIndex != lastIndex) {
            address lastNode = trustees[lastIndex];
            trustees[trusteeIndex] = lastNode;
            trusteeNumbers[lastNode] = trusteeIndex + 1;
        }

        trustees.pop();
        removedTrustees.push(_node);
        emit TrustedNodeRemoval(_node);
    }

    /** Incements the counter when the trustee reveals their vote
     * only callable by the CurrencyGovernance contract
     */
    function recordVote(address _who) external onlyTrusteeGovernance(){
        votingRecord[_who]++;

        if (unallocatedRewardsCount > 0) {
            unallocatedRewardsCount--;
        }
    }

    /** Return the number of entries in trustedNodes array.
     */
    function numTrustees() external view returns (uint256) {
        return trustees.length;
    }

    // /** Checks if a node address is trusted in the current cohort
    //  */
    function isTrusted(address _node) public view returns (bool) {
        return trusteeNumbers[_node] > 0;
    }

    // occurs on election
    // previous years voting record is fully vested at this point, so swept into that bucket
    // this year's voting is now available to start vesting, swept into lastYearVotingRecord
    // every year this will need to be called for two contracts: TrustedNodes for the current and previous cohorts
    function cohortChange() public onlyPolicy {
        termEndTimestamp = getTime();
        uint256 trusteeCount = trustees.length;
        uint256 removedCount = removedTrustees.length;
        address trustee;
        for (uint256 i = 0; i < trusteeCount; i++) {
            trustee = trustees[i];
            fullyVestedRewards[trustee] += lastYearVotingRecord[trustee];
            lastYearVotingRecord[trustee] = votingRecord[trustee];
            votingRecord[trustee] = 0;
        }
        for (uint256 i = 0; i < removedCount; i++) {
            fullyVestedRewards[trustee] += lastYearVotingRecord[trustee];
            lastYearVotingRecord[trustee] = votingRecord[trustee];
            votingRecord[trustee] = 0;
        }
    }

    // withdraws everything that can be withdrawn
    // marks th
    function withdraw() public {
        uint256 lastWithdrawal = lastWithdrawals[msg.sender];
        uint256 currentTime = getTime();
        lastWithdrawals[msg.sender] = currentTime;
        if(lastWithdrawal == 0) {
            lastWithdrawal = termEndTimestamp;
        }
        uint256 limit = (currentTime - lastWithdrawal)/generationTime;
        uint256 lastYearWithdrawals = limit > lastYearVotingRecord[msg.sender] ? lastYearVotingRecord[msg.sender] : limit;
        uint256 toWithdraw = (fullyVestedRewards[msg.sender] + lastYearWithdrawals) * voteReward;
        fullyVestedRewards[msg.sender] = 0;
        lastYearVotingRecord[msg.sender] -= lastYearWithdrawals;

        ECOx(EcoXAddress).transfer(msg.sender, toWithdraw);
        emit VotingRewardRedemption(msg.sender, toWithdraw);

    }
}
