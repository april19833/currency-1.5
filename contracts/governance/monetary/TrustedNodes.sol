// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../policy/Policed.sol";
import "../../currency/ECOx.sol";
import "../../utils/TimeUtils.sol";
import "./CurrencyGovernance.sol";

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

    uint256 public termEnd;

    uint256 public termLength;

    // address with the trusteeGovernance role
    address public trusteeGovernanceRole;

    address public EcoXAddress;

    mapping(address => uint256) public trusteeNumbers;

    address[] public trustees;

    /** Represents the number of votes for which the trustee can claim rewards.
    Increments each time the trustee votes, decremented on withdrawal */
    mapping(address => uint256) public votingRecord;

    // timestamp of last withdrawal
    mapping(address => uint256) lastWithdrawals;

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

    event TrusteeGovernanceRoleChanged(address newRoleHolder);

    modifier onlyTrusteeGovernance() {
        require(
            msg.sender == trusteeGovernanceRole,
            "only the trusteeGovernanceRole holder may call this method"
        );
        _;
    }

    /** Creates a new trusted node registry, populated with some initial nodes.
     */
    constructor(
        Policy _policy,
        CurrencyGovernance _currencyGovernance,
        ECOx _ecox,
        uint256 _termLength,
        uint256 _voteReward,
        address[] memory _initialTrustedNodes
    ) Policed(_policy) {
        trusteeGovernanceRole = address(_currencyGovernance);
        EcoXAddress = address(_ecox);
        termLength = _termLength;
        termEnd = getTime() + termLength;
        voteReward = _voteReward;
        uint256 numTrustees = _initialTrustedNodes.length;
        for (uint256 i = 0; i < numTrustees; i++) {
            _trust(_initialTrustedNodes[i]);
        }
    }

    function getLastWithdrawal(
        address trustee
    ) internal view returns (uint256 time) {
        return termEnd + lastWithdrawals[trustee];
    }

    function updateTrusteeGovernanceRole(
        address _currencyGovernance
    ) public onlyPolicy {
        trusteeGovernanceRole = _currencyGovernance;
        emit TrusteeGovernanceRoleChanged(_currencyGovernance);
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

    /** helper for trust
     * @param _node The node to start trusting.
     */
    function _trust(address _node) internal {
        require(!isTrusted(_node), "Node already trusted");
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
        delete trusteeNumbers[_node];
        trustees.pop();
        emit TrustedNodeRemoval(_node);
    }

    /** Incements the counter when the trustee reveals their vote
     * only callable by the CurrencyGovernance contract
     */
    function recordVote(address _who) external onlyTrusteeGovernance {
        votingRecord[_who]++;
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

    // withdraws everything that can be withdrawn
    function withdraw() public {
        uint256 numWithdrawals = calculateWithdrawal(msg.sender);
        require(numWithdrawals > 0, "You have not vested any tokens");
        uint256 toWithdraw = numWithdrawals * voteReward;
        lastWithdrawals[msg.sender] += numWithdrawals * generationTime;
        votingRecord[msg.sender] -= numWithdrawals;

        ECOx(EcoXAddress).transfer(msg.sender, toWithdraw);
        emit VotingRewardRedemption(msg.sender, toWithdraw);
    }

    function currentlyWithdrawable() public view returns (uint256 amount) {
        return voteReward * calculateWithdrawal(msg.sender);
    }

    function calculateWithdrawal(
        address withdrawer
    ) internal view returns (uint256 amount) {
        uint256 timeNow = getTime();
        if (timeNow < termEnd) {
            return 0;
        }

        uint256 lastWithdrawal = getLastWithdrawal(withdrawer);
        uint256 limit = (timeNow - lastWithdrawal) / generationTime;
        uint256 numWithdrawals = limit > votingRecord[withdrawer]
            ? votingRecord[withdrawer]
            : limit;
        return numWithdrawals;
    }

    function fullyVested()
        public
        view
        returns (uint256 amount, uint256 timestamp)
    {
        uint256 record = votingRecord[msg.sender];
        return (record * voteReward, termEnd + record * generationTime);
    }

    function sweep(address recipient) public onlyPolicy {
        ECOx(EcoXAddress).transfer(
            recipient,
            ECOx(EcoXAddress).balanceOf(address(this))
        );
    }
}
