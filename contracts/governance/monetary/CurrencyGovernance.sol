// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "./TrustedNodes.sol";

/** @title Trustee monetary policy decision process
 *
 * This contract oversees the voting on the currency monetary levers.
 * Trustees vote on a policy that is implemented at the conclusion of the cycle
 */
contract CurrencyGovernance is Policed, Pausable, TimeUtils {
    // data structure for monetary policy proposals
    struct MonetaryPolicy {
        // random inflation recipients
        uint256 numberOfRecipients;
        // amount of weico recieved by each random inflation recipient
        uint256 randomInflationReward;
        // duration in seconds
        uint256 lockupDuration;
        // lockup interest as a 9 digit fixed point number
        uint256 lockupInterest;
        // multiplier for linear inflation as an 18 digit fixed point number
        uint256 inflationMultiplier;
        // to store a link to more information
        string description;
    }

    // struct for the array of submitted votes
    struct Vote {
        // the proposal being voted for
        // proposals must be scored in ascending order of address to be accepted
        address proposal;
        // the score of this proposal within the ballot, min recorded score is one
        // to get a score of zero, an item must be unscored
        uint256 score;
    }

    // struct for the getCurrentStage() return data type
    struct TimingData {
        // the cycle index
        // calculated by looking at how many CYCLE_LENGTHs have elapsed since the governanceStartTime
        uint256 currentCycle;
        // the governance stage
        // calculated by looking at how much time has progressed during the current cycle
        Stage currentStage;
    }

    // enum for denoting the current stage in getCurrentStage()
    enum Stage {
        Propose,
        Commit,
        Reveal
    }

    // this var stores the current contract that holds the trusted nodes role
    TrustedNodes public trustedNodes;

    // this variable tracks the start of governance
    // it is use to track the voting cycle and stage
    uint256 public immutable governanceStartTime;

    // timescales
    uint256 public constant PROPOSAL_TIME = 10 days;
    uint256 public constant VOTING_TIME = 3 days;
    uint256 public constant REVEAL_TIME = 1 days;
    uint256 public constant CYCLE_LENGTH = PROPOSAL_TIME + VOTING_TIME + REVEAL_TIME;

    uint256 public constant IDEMPOTENT_INFLATION_MULTIPLIER = 1e18;

    // max length of description field
    uint256 public constant MAX_DATA = 160;

    // mapping of cycle to proposing trustee addresses to their submitted proposals
    mapping(uint256 => mapping(address => MonetaryPolicy)) public proposals;
    // mapping of cycle to trustee addresses to their hash commits for voting
    mapping(uint256 => mapping(address => bytes32)) public commitments;
    // mapping of cycle to proposals (indexed by the submitting trustee) to their voting score, accumulated during reveal
    mapping(uint256 => mapping(address => uint256)) public score;

    // used to track the leading proposal during the vote totalling
    address public leader;
    // used to denote the winning proposal when the vote is finalized
    mapping(uint256 => address) public winner;

    // address that can pause currency governance
    address public pauser;

    // setting the trusted nodes address to a bad address stops governance
    error NonZeroTrustedNodesAddr();

    // For if a non-trustee address tries to access trustee role gated functionality
    error TrusteeOnlyFunction();

    // For if a non-pauser address tries to access pauser role gated functionality
    error PauserOnlyFunction();

    // For when governance calls are made before or after their time windows for their stage
    error WrongStage();

    /** Bad cycle request error
     * for when a cycle is attempted to interacted with before or after its time
     * found on all stage related functions
     * @param requestedCycle the cycle submitted by the end user to access
     * @param currentCycle the current cycle as calculated by the contract
     */
    error CycleInactive(uint256 requestedCycle, uint256 currentCycle);

    /** Early finazilation error
     * for when a cycle is attempted to be finalized before it finishes
     * @param requestedCycle the cycle submitted by the end user to access
     * @param currentCycle the current cycle as calculated by the contract
     */
    error CycleIncomplete(uint256 requestedCycle, uint256 currentCycle);

    // emitted when a proposal is submitted to track the values
    event ProposalCreation(
        address indexed trusteeAddress,
        uint256 _numberOfRecipients,
        uint256 _randomInflationReward,
        uint256 _lockupDuration,
        uint256 _lockupInterest,
        uint256 _inflationMultiplier,
        string _description
    );

    // emitted when a trustee retracts their proposal
    event ProposalRetraction(address indexed trustee);

    /** Fired when a trustee casts a vote.
     */
    event VoteCast(address indexed trustee);

    /** Fired when a vote is revealed, to create a voting history for all
     * participants. Records the voter, as well as all of the parameters of
     * the vote cast.
     */
    event VoteReveal(address indexed voter, Vote[] votes);

    /** Fired when vote results are computed, creating a permanent record of
     * vote outcomes.
     */
    event VoteResult(address indexed winner);

    /**
     * @notice event indicating the pauser was updated
     * @param pauser The new pauser
     */
    event PauserAssignment(address indexed pauser);

    /** Restrict access to trusted nodes only.
     */
    modifier onlyTrusted() {
        if(
            !trustedNodes.isTrusted(msg.sender)
        ) {
            revert TrusteeOnlyFunction();
        }
        _;
    }

    modifier onlyPauser() {
        if(msg.sender != pauser){
            revert PauserOnlyFunction();
        }
        _;
    }

    modifier duringProposePhase(uint256 cycleIndex) {
        uint256 timeDifference = getTime() - governanceStartTime;
        uint256 completedCycles = timeDifference/CYCLE_LENGTH;
        uint256 governanceTime = timeDifference%CYCLE_LENGTH;

        if(completedCycles != cycleIndex) {
            revert CycleInactive(cycleIndex, completedCycles);
        }
        
        if(governanceTime >= PROPOSAL_TIME) {
            revert WrongStage();
        }
        _;
    }

    modifier duringVotePhase(uint256 cycleIndex) {
        uint256 timeDifference = getTime() - governanceStartTime;
        uint256 completedCycles = timeDifference/CYCLE_LENGTH;
        uint256 governanceTime = timeDifference%CYCLE_LENGTH;

        if(completedCycles != cycleIndex) {
            revert CycleInactive(cycleIndex, completedCycles);
        }

        if(governanceTime < PROPOSAL_TIME || governanceTime >= PROPOSAL_TIME+VOTING_TIME) {
            revert WrongStage();
        }
        _;
    }

    modifier duringRevealPhase(uint256 cycleIndex) {
        uint256 timeDifference = getTime() - governanceStartTime;
        uint256 completedCycles = timeDifference/CYCLE_LENGTH;
        uint256 governanceTime = timeDifference%CYCLE_LENGTH;

        if(completedCycles != cycleIndex) {
            revert CycleInactive(cycleIndex, completedCycles);
        }

        if(governanceTime < PROPOSAL_TIME+VOTING_TIME) {
            revert WrongStage();
        }
        _;
    }

    modifier cycleComplete(uint256 cycle) {
        uint256 completedCycles = (getTime() - governanceStartTime)/CYCLE_LENGTH;

        if(completedCycles <= cycle) {
            revert CycleIncomplete(cycle, completedCycles);
        }
        _;
    }

    constructor(Policy _policy, TrustedNodes _trustedNodes, address _initialPauser) Policed(_policy) {
        _setTrustedNodes(_trustedNodes);
        pauser = _initialPauser;
        governanceStartTime = getTime();
        emit PauserAssignment(_initialPauser);
    }

    function setTrustedNodes(TrustedNodes _trustedNodes) public onlyPolicy {
        _setTrustedNodes(_trustedNodes);
    }

    function _setTrustedNodes(TrustedNodes _trustedNodes) internal {
        if(
            address(_trustedNodes) == address(0)
        ) {
            revert NonZeroTrustedNodesAddr();
        }
        trustedNodes = _trustedNodes;
    }

    function getCurrentStage() public view returns (TimingData memory) {
        uint256 timeDifference = getTime() - governanceStartTime;
        uint256 completedCycles = timeDifference/CYCLE_LENGTH;
        uint256 governanceTime = timeDifference%CYCLE_LENGTH;

        if(governanceTime < PROPOSAL_TIME) {
            return TimingData(completedCycles, Stage.Propose);
        } else if(governanceTime < PROPOSAL_TIME+VOTING_TIME) {
            return TimingData(completedCycles, Stage.Commit);
        } else {
            return TimingData(completedCycles, Stage.Reveal);
        }
    }

    function propose(
        uint256 _cycle,
        uint256 _numberOfRecipients,
        uint256 _randomInflationReward,
        uint256 _lockupDuration,
        uint256 _lockupInterest,
        uint256 _inflationMultiplier,
        string calldata _description
    ) external onlyTrusted duringProposePhase(_cycle) {
        require(
            _inflationMultiplier > 0,
            "Inflation multiplier cannot be zero"
        );
        require(
            // didn't choose this number for any particular reason
            uint256(bytes(_description).length) <= MAX_DATA,
            "Description is too long"
        );

        MonetaryPolicy storage p = proposals[_cycle][msg.sender];
        p.numberOfRecipients = _numberOfRecipients;
        p.randomInflationReward = _randomInflationReward;
        p.lockupDuration = _lockupDuration;
        p.lockupInterest = _lockupInterest;
        p.inflationMultiplier = _inflationMultiplier;
        p.description = _description;

        emit ProposalCreation(
            msg.sender,
            _numberOfRecipients,
            _randomInflationReward,
            _lockupDuration,
            _lockupInterest,
            _inflationMultiplier,
            _description
        );
    }

    function unpropose(uint256 _cycle) external duringProposePhase(_cycle) {
        require(
            proposals[_cycle][msg.sender].inflationMultiplier != 0,
            "You do not have a proposal to retract"
        );
        delete proposals[_cycle][msg.sender];
        emit ProposalRetraction(msg.sender);
    }

    function commit(uint256 _cycle, bytes32 _commitment)
        external
        onlyTrusted
        duringVotePhase(_cycle)
    {
        commitments[_cycle][msg.sender] = _commitment;
        emit VoteCast(msg.sender);
    }

    function reveal(uint256 _cycle, bytes32 _seed, Vote[] calldata _votes)
        external
        duringRevealPhase(_cycle)
    {
        uint256 numVotes = _votes.length;
        require(numVotes > 0, "Invalid vote, cannot vote empty");
        require(
            commitments[_cycle][msg.sender] != bytes32(0),
            "Invalid vote, no unrevealed commitment exists"
        );
        require(
            keccak256(abi.encode(_seed, msg.sender, _votes)) ==
                commitments[_cycle][msg.sender],
            "Invalid vote, commitment mismatch"
        );

        delete commitments[_cycle][msg.sender];

        // remove the trustee's default vote
        // default vote needs to change
        // likely changes to default support of the default proposal
        score[_cycle][address(0)] -= 1;

        // use memory vars to store and track the changes of the leader
        address priorLeader = leader;
        address leaderTracker = priorLeader;
        uint256 leaderRankTracker = 0;

        /**
         * by setting this to 1, the code can skip checking _score != 0
         */
        uint256 scoreDuplicateCheck = 1;

        for (uint256 i = 0; i < numVotes; ++i) {
            Vote memory v = _votes[i];
            address _proposal = v.proposal;
            uint256 _score = v.score;

            require(
                proposals[_cycle][_proposal].inflationMultiplier > 0,
                "Invalid vote, missing proposal"
            );
            require(
                i == 0 || _votes[i - 1].proposal < _proposal,
                "Invalid vote, proposals not in increasing order"
            );
            require(
                _score <= numVotes,
                "Invalid vote, proposal score out of bounds"
            );
            require(
                scoreDuplicateCheck & (1 << _score) == 0,
                "Invalid vote, duplicate score"
            );

            scoreDuplicateCheck += 1 << _score;

            score[_cycle][_proposal] += _score;
            if (score[_cycle][_proposal] > score[_cycle][leaderTracker]) {
                leaderTracker = _proposal;
                leaderRankTracker = _score;
            } else if (score[_cycle][_proposal] == score[_cycle][leaderTracker]) {
                if (_score > leaderRankTracker) {
                    leaderTracker = _proposal;
                    leaderRankTracker = _score;
                }
            }
        }

        // only changes the leader if the new leader is of greater score
        if (
            leaderTracker != priorLeader &&
            score[_cycle][leaderTracker] > score[_cycle][priorLeader]
        ) {
            leader = leaderTracker;
        }

        // record the trustee's vote for compensation purposes
        trustedNodes.recordVote(msg.sender);

        emit VoteReveal(msg.sender, _votes);
    }

    function compute(uint256 _cycle) external cycleComplete(_cycle) {
        // if paused then the default policy automatically wins
        if (!paused()) {
            winner[_cycle] = leader;
        }
        // need a marker of computation complete that doesn't depend on if the vote is paused or not
        // probably pausing can be removed in general

        emit VoteResult(winner[_cycle]);
    }

    // initialization no longer required
    // /** Initialize the storage context using parameters copied from the
    //  * original contract (provided as _self).
    //  *
    //  * Can only be called once, during proxy initialization.
    //  *
    //  * @param _self The original contract address.
    //  */
    // function initialize(address _self) public override onlyConstruction {
    //     super.initialize(_self);
    //     proposalEnds = getTime() + PROPOSAL_TIME;
    //     votingEnds = proposalEnds + VOTING_TIME;
    //     revealEnds = votingEnds + REVEAL_TIME;

    //     // should not emit an event
    //     pauser = CurrencyGovernance(_self).pauser();

    //     MonetaryPolicy storage p = proposals[currentCycle][address(0)];
    //     p.inflationMultiplier = IDEMPOTENT_INFLATION_MULTIPLIER;

    //     // sets the default votes for the default proposal
    //     score[address(0)] = trustedNodes.numTrustees();
    // }

    // pausing likely no longer required
    /**
     * @notice set the given address as the pauser
     * @param _pauser The address that can pause this token
     * @dev only the roleAdmin can call this function
     */
    function setPauser(address _pauser) public onlyPolicy {
        pauser = _pauser;
        emit PauserAssignment(_pauser);
    }

    /**
     * @notice pauses transfers of this token
     * @dev only callable by the pauser
     */
    function pause() external onlyPauser {
        _pause();
    }

    /**
     * @notice unpauses transfers of this token
     * @dev only callable by the pauser
     */
    function unpause() external onlyPauser {
        _unpause();
    }
}
