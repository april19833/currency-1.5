// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TrustedNodes.sol";
import "../../utils/TimeUtils.sol";
import "../../policy/Policed.sol";

/** @title Trustee monetary policy decision process
 *
 * This contract oversees the voting on the currency monetary levers.
 * Trustees vote on a policy that is implemented at the conclusion of the cycle
 */
contract CurrencyGovernance is Policed, TimeUtils {
    //////////////////////////////////////////////
    /////////////////// TYPES ////////////////////
    //////////////////////////////////////////////

    // data structure for monetary policy proposals
    struct MonetaryPolicy {
        // reverse lookup parameter
        bytes32 id;
        // addresses to call if the proposal succeeds
        address[] targets;
        // the function signatures to call
        bytes4[] signatures;
        // the abi encoded data to call
        bytes[] calldatas;
        // the number of trustees supporting the proposal
        uint256 support;
        // the mapping of who is supporting (note, this persists past deletion)
        // this is to avoid double supporting and to confirm and record unspports
        mapping(address => bool) supporters;
        // to store a link to more information
        string description;

        // // random inflation recipients
        // uint256 numberOfRecipients;
        // // amount of weico recieved by each random inflation recipient
        // uint256 randomInflationReward;
        // // duration in seconds
        // uint256 lockupDuration;
        // // lockup interest as a 9 digit fixed point number
        // uint256 lockupInterest;
        // // multiplier for linear inflation as an 18 digit fixed point number
        // uint256 inflationMultiplier;
        // // to store a link to more information
        // string description;
    }

    // struct for the array of submitted votes
    struct Vote {
        // the address of the trustee who submitted the proposal being voted for
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

    //////////////////////////////////////////////
    //////////////////// VARS ////////////////////
    //////////////////////////////////////////////

    // this var stores the current contract that holds the trusted nodes role
    TrustedNodes public trustedNodes;

    // this variable tracks the start of governance
    // it is use to track the voting cycle and stage
    uint256 public immutable governanceStartTime;

    // timescales
    uint256 public constant PROPOSAL_TIME = 10 days;
    uint256 public constant VOTING_TIME = 3 days;
    uint256 public constant REVEAL_TIME = 1 days;
    uint256 public constant CYCLE_LENGTH =
        PROPOSAL_TIME + VOTING_TIME + REVEAL_TIME;

    uint256 public constant IDEMPOTENT_INFLATION_MULTIPLIER = 1e18;

    // max length of description field
    uint256 public constant MAX_DESCRIPTION_DATA = 160;

    // max length of the targets array
    // idk man, gotta have some kind of limit
    uint256 public constant MAX_TARGETS = 10;

    // mapping of proposal IDs to submitted proposals
    // proposalId hashes include the _cycle as a parameter
    mapping(bytes32 => MonetaryPolicy) public proposals;
    // mapping of trustee addresses to cycle number to track if they have supported (and can therefore not support again)
    mapping(address => uint256) internal trusteeSupports;
    // mapping of cycle to trustee addresses to their hash commits for voting
    mapping(uint256 => mapping(address => bytes32)) public commitments;
    // mapping of cycle to proposals (indexed by the submitting trustee) to their voting score, accumulated during reveal
    mapping(uint256 => mapping(address => uint256)) public score;

    // used to track the leading proposalId during the vote totalling
    bytes32 public leader;
    // used to denote the winning proposalId when the vote is finalized
    mapping(uint256 => address) public winner;
    // this still doesn't quite work as is
    // need to prevent calling compute much later to try and grab the current leader

    //////////////////////////////////////////////
    /////////////////// ERRORS ///////////////////
    //////////////////////////////////////////////

    // setting the trusted nodes address to a bad address stops governance
    error NonZeroTrustedNodesAddr();

    // For if a non-trustee address tries to access trustee role gated functionality
    error TrusteeOnlyFunction();

    // For when governance calls are made before or after their time windows for their stage
    error WrongStage();

    /** Early finazilation error
     * for when a cycle is attempted to be finalized before it finishes
     * @param requestedCycle the cycle submitted by the end user to access
     * @param currentCycle the current cycle as calculated by the contract
     */
    error CycleIncomplete(uint256 requestedCycle, uint256 currentCycle);
    
    /** Description length error
     * for when a proposal is submitted with too long of a description
     * @param submittedLength the length of the submitted description, to be compared against MAX_DESCRIPTION_DATA
     */
    error ExceedsMaxDescriptionSize(uint256 submittedLength);
    
    /** Targets length error
     * for when a proposal is submitted with too many actions or zero actions
     * @param submittedLength the length of the submitted targets array, to be compared against MAX_TARGETS and 0
     */
    error BadNumTargets(uint256 submittedLength);

    // error for when the 3 arrays submitted for the proposal don't all have the same number of elements
    error ProposalActionsArrayMismatch();

    // error for when a trustee is already supporting a policy and tries to propose or support another policy
    error SupportAlreadyGiven();

    // error for when a trustee is not supporting a policy and tries unsupport
    error SupportNotGiven();

    // error for when a proposal is submitted that's a total duplicate of an existing one
    error DuplicateProposal();

    // error for when a proposal is supported that hasn't actually been proposed
    error NoSuchProposal();

    // error for when a proposal is supported that has already been supported by the msg.sender
    error DuplicateSupport();

    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

    /**
     * emits when the trustedNodes contract is changed
     * @param newTrustedNodes denotes the new trustedNodes contract address
     * @param oldTrustedNodes denotes the old trustedNodes contract address
     */
    event NewTrustedNodes(TrustedNodes newTrustedNodes, TrustedNodes oldTrustedNodes);

    /** Tracking for proposal creation
     * emitted when a proposal is submitted to track the values
     * @param _trusteeAddress the address of the trustee that submitted the proposal
     * @param _cycle the cycle during which the proposal was submitted
     * @param id the lookup id for the proposal in the proposals mapping
     * is created via a hash of _cycle, _targets, _signatures, and _calldatas; see getProposalHash for more details
     * param _targets the addresses to be called by the proposal
     * param _signatures the function signatures to call on each of the targets
     * param _calldatas the calldata to pass to each of the functions called on each target
     * @param _description a string allowing the trustee to describe the proposal or link to discussions on the proposal
     */ 
    event ProposalCreation(
        address indexed _trusteeAddress,
        uint256 indexed _cycle,
        bytes32 id,
        // address[] _targets,
        // bytes4[] _signatures,
        // bytes[] _calldatas,
        string _description
    );

    /** Tracking for support actions
     * emitted when a trustee adds their support for a proposal
     * @param trustee the address of the trustee supporting
     * @param proposalId the lookup for the proposal being supported
     * @param cycle the cycle during which the support action happened
     */ 
    event Support(address indexed trustee, bytes32 indexed proposalId, uint256 indexed cycle);

    /** Tracking for unsupport actions
     * emitted when a trustee retracts their support for a proposal
     * @param trustee the address of the trustee unsupporting
     * @param proposalId the lookup for the proposal being unsupported
     * @param cycle the cycle during which the support action happened
     */ 
    event Unsupport(address indexed trustee, bytes32 indexed proposalId, uint256 indexed cycle);

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

    //////////////////////////////////////////////
    ////////////////// MODIFIERS /////////////////
    //////////////////////////////////////////////

    /** Restrict access to trusted nodes only.
     */
    modifier onlyTrusted() {
        if (!trustedNodes.isTrusted(msg.sender)) {
            revert TrusteeOnlyFunction();
        }
        _;
    }

    // for functions related to proposing monetary policy
    modifier duringProposePhase() {
        if ((getTime() - governanceStartTime) % CYCLE_LENGTH >= PROPOSAL_TIME) {
            revert WrongStage();
        }
        _;
    }

    // for functions related to committing votes
    modifier duringVotePhase() {
        uint256 governanceTime = (getTime() - governanceStartTime) %
            CYCLE_LENGTH;

        if (
            governanceTime < PROPOSAL_TIME ||
            governanceTime >= PROPOSAL_TIME + VOTING_TIME
        ) {
            revert WrongStage();
        }
        _;
    }

    // for functions related to revealing votes
    modifier duringRevealPhase() {
        if (
            (getTime() - governanceStartTime) % CYCLE_LENGTH <
            PROPOSAL_TIME + VOTING_TIME
        ) {
            revert WrongStage();
        }
        _;
    }

    // for finalizing the outcome of a vote
    modifier cycleComplete(uint256 cycle) {
        uint256 completedCycles = (getTime() - governanceStartTime) /
            CYCLE_LENGTH;

        if (completedCycles <= cycle) {
            revert CycleIncomplete(cycle, completedCycles);
        }
        _;
    }

    //////////////////////////////////////////////
    ///////////////// CONSTRUCTOR ////////////////
    //////////////////////////////////////////////

    /** constructor
     * @param _policy the owning policy address for the contract
     * @param _trustedNodes the contract to manage what addresses are trustees
     */
    constructor(Policy _policy, TrustedNodes _trustedNodes) Policed(_policy) {
        _setTrustedNodes(_trustedNodes);
        governanceStartTime = getTime();
    }

    //////////////////////////////////////////////
    ////////////////// FUNCTIONS /////////////////
    //////////////////////////////////////////////

    /** setter function for trustedNodes var
     * only available to the owning policy contract
     * @param _trustedNodes the value to set the new trustedNodes address to, cannot be zero
     */
    function setTrustedNodes(TrustedNodes _trustedNodes) public onlyPolicy {
        emit NewTrustedNodes(_trustedNodes, trustedNodes);
        _setTrustedNodes(_trustedNodes);
    }

    function _setTrustedNodes(TrustedNodes _trustedNodes) internal {
        if (address(_trustedNodes) == address(0)) {
            revert NonZeroTrustedNodesAddr();
        }
        trustedNodes = _trustedNodes;
    }

    /** getter for timing data
     * calculates and returns the current cycle and the current stage
     * @return TimingData type of { uint256 cycle, Stage stage }
     */
    function getCurrentStage() public view returns (TimingData memory) {
        uint256 timeDifference = getTime() - governanceStartTime;
        uint256 completedCycles = timeDifference / CYCLE_LENGTH;
        uint256 governanceTime = timeDifference % CYCLE_LENGTH;

        if (governanceTime < PROPOSAL_TIME) {
            return TimingData(completedCycles, Stage.Propose);
        } else if (governanceTime < PROPOSAL_TIME + VOTING_TIME) {
            return TimingData(completedCycles, Stage.Commit);
        } else {
            return TimingData(completedCycles, Stage.Reveal);
        }
    }

    /** getter for just the current cycle
     * calculates and returns, used internally
     * @return cycle the index for the currently used governance recording mappings
     */
    function getCurrentCycle() public view returns (uint256) {
        return (getTime() - governanceStartTime) / CYCLE_LENGTH;
    }

    /** propose a monetary policy
     * this function allows trustees to submit a potential monetary policy
     * if there is already a proposed monetary policy by the trustee, this overwrites it
     * \\param these will be done later when I change this whole function
     */
    function propose(
        address[] calldata targets,
        bytes4[] calldata signatures,
        bytes[] memory calldatas,
        string calldata description
    ) external onlyTrusted duringProposePhase {
        uint256 cycle = getCurrentCycle();
        if(!canSupport(msg.sender)) {
            revert SupportAlreadyGiven();
        }

        trusteeSupports[msg.sender] = cycle;
        
        uint256 descriptionLength = bytes(description).length;
        if(
            descriptionLength > MAX_DESCRIPTION_DATA
        ) {
            revert ExceedsMaxDescriptionSize(descriptionLength);
        }

        uint256 numTargets = targets.length;
        if(
            numTargets > MAX_TARGETS || numTargets <= 0
        ) {
            revert BadNumTargets(numTargets);
        }
        if(
            numTargets != signatures.length || numTargets != calldatas.length
        ) {
            revert ProposalActionsArrayMismatch();
        }

        bytes32 proposalId = getProposalId(cycle, targets, signatures, calldatas);

        MonetaryPolicy storage p = proposals[proposalId];

        // THIS IS NOT A GUARANTEE FOR DUPLICATE PROPOSALS JUST A SAFEGUARD FOR OVERWRITING
        if(p.support != 0) {
            revert DuplicateProposal();
        }
        p.support = 1;
        p.supporters[msg.sender] = true;

        p.id = proposalId;
        p.targets = targets;
        p.signatures = signatures;
        p.calldatas = calldatas;
        p.description = description;

        emit ProposalCreation(
            msg.sender,
            cycle,
            proposalId,
            // targets,
            // signatures,
            // calldatas,
            description
        );
        emit Support(msg.sender, proposalId, cycle);
    }

    function getProposalId(
        uint256 _cycle,
        address[] calldata _targets,
        bytes4[] calldata _signatures,
        bytes[] memory _calldatas
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_cycle,keccak256(abi.encode(_targets, _signatures, _calldatas))));
    }

    /** getter for duplicate support checks
     * the function just pulls to see if the address has supported this generation
     * doesn't check to see if the address is a trustee
     * @param _address the address to check. not msg.sender for dapp related purposes
     */
    function canSupport(address _address) public view returns (bool) {
        return trusteeSupports[_address] < getCurrentCycle();
    }

    /** add your support to a monetary policy
     * this function allows you to increase the support weight to an already submitted proposal
     * the submitter of a proposal default supports it
     * support for a proposal is close to equivalent of submitting a duplicate proposal to pad the ranking
     * need to link to borda count analysis by christian here
     * @param proposalId the lookup ID for the proposal that's being supported
     */
    function supportProposal(bytes32 proposalId) external {
        if(!canSupport(msg.sender)) {
            revert SupportAlreadyGiven();
        }

        trusteeSupports[msg.sender] = getCurrentCycle();

        MonetaryPolicy storage p = proposals[proposalId];

        if(p.support == 0) {
            revert NoSuchProposal();
        }
        if(p.supporters[msg.sender]) {
            revert DuplicateSupport();
        }

        p.support++;
        p.supporters[msg.sender] = true;
    }

    /** removes your support to a monetary policy
     * this function allows you to reduce the support weight to an already submitted proposal
     * you must unsupport first if you currently have supported if you want to support or propose another proposal
     * the last person who unsupports the proposal deletes the proposal
     * @param proposalId the lookup ID for the proposal that's being unsupported
     */
    function unsupportProposal(bytes32 proposalId) external {
        MonetaryPolicy storage p = proposals[proposalId];
        uint256 support = p.support;

        if(support == 0) {
            revert NoSuchProposal();
        }
        if(!p.supporters[msg.sender]) {
            revert SupportNotGiven();
        }

        if(support == 1) {
            p.supporters[msg.sender] = false;
            delete proposals[proposalId];
        } else {
            p.support--;
        }

        trusteeSupports[msg.sender] = 0;
    }

    /** retract a monetary policy
     * this function allows trustees to retract their existing proposal, deleting its data
     * reverts if no proposal exists to unpropose
     * cannot be used after propose phase ends
     */
    // function unpropose() external duringProposePhase {
    //     uint256 _cycle = getCurrentCycle();
    //     require(
    //         proposals[_cycle][msg.sender].inflationMultiplier != 0,
    //         "You do not have a proposal to retract"
    //     );
    //     delete proposals[_cycle][msg.sender];
    //     emit ProposalRetraction(msg.sender);
    // }

    /** submit a vote commitment
     * this function allows trustees to submit a commit hash of their vote
     * commitment is salted so that it is a blind vote process
     * calling additional times overwrites previous commitments
     * @param _commitment the hash commit to check against when revealing
     */
    function commit(bytes32 _commitment) external onlyTrusted duringVotePhase {
        commitments[getCurrentCycle()][msg.sender] = _commitment;
        emit VoteCast(msg.sender);
    }

    /** reveal a committed vote
     * this function allows trustees to reveal their previously committed votes once the reveal phase is entered
     * in revealing the vote, votes are tallied, a running tally of each proposal's votes is kept in storage during this phase
     * @param _seed the salt for the commit hash to make the vote secret
     * @param _votes the array of Vote objects { address proposal, uint256 ranking } that follows our modified Borda scheme. The votes need to be arranged in ascending order of address and ranked via the integers 1 to the number of proposals ranked.
     */
    function reveal(
        bytes32 _seed,
        Vote[] calldata _votes
    ) external duringRevealPhase {
        uint256 _cycle = getCurrentCycle();
        // uint256 numVotes = _votes.length;
        // require(numVotes > 0, "Invalid vote, cannot vote empty");
        // require(
        //     commitments[_cycle][msg.sender] != bytes32(0),
        //     "Invalid vote, no unrevealed commitment exists"
        // );
        // require(
        //     keccak256(abi.encode(_seed, msg.sender, _votes)) ==
        //         commitments[_cycle][msg.sender],
        //     "Invalid vote, commitment mismatch"
        // );

        // delete commitments[_cycle][msg.sender];

        // // remove the trustee's default vote
        // // default vote needs to change
        // // likely changes to default support of the default proposal
        // score[_cycle][address(0)] -= 1;

        // // use memory vars to store and track the changes of the leader
        // address priorLeader = leader;
        // address leaderTracker = priorLeader;
        // uint256 leaderRankTracker = 0;

        // /**
        //  * by setting this to 1, the code can skip checking _score != 0
        //  */
        // uint256 scoreDuplicateCheck = 1;

        // for (uint256 i = 0; i < numVotes; ++i) {
        //     Vote memory v = _votes[i];
        //     address _proposal = v.proposal;
        //     uint256 _score = v.score;

        //     require(
        //         proposals[_cycle][_proposal].inflationMultiplier > 0,
        //         "Invalid vote, missing proposal"
        //     );
        //     require(
        //         i == 0 || _votes[i - 1].proposal < _proposal,
        //         "Invalid vote, proposals not in increasing order"
        //     );
        //     require(
        //         _score <= numVotes,
        //         "Invalid vote, proposal score out of bounds"
        //     );
        //     require(
        //         scoreDuplicateCheck & (1 << _score) == 0,
        //         "Invalid vote, duplicate score"
        //     );

        //     scoreDuplicateCheck += 1 << _score;

        //     score[_cycle][_proposal] += _score;
        //     if (score[_cycle][_proposal] > score[_cycle][leaderTracker]) {
        //         leaderTracker = _proposal;
        //         leaderRankTracker = _score;
        //     } else if (score[_cycle][_proposal] == score[_cycle][leaderTracker]) {
        //         if (_score > leaderRankTracker) {
        //             leaderTracker = _proposal;
        //             leaderRankTracker = _score;
        //         }
        //     }
        // }

        // // only changes the leader if the new leader is of greater score
        // if (
        //     leaderTracker != priorLeader &&
        //     score[_cycle][leaderTracker] > score[_cycle][priorLeader]
        // ) {
        //     leader = leaderTracker;
        // }

        // // record the trustee's vote for compensation purposes
        // trustedNodes.recordVote(msg.sender);

        emit VoteReveal(msg.sender, _votes);
    }

    /** write the result of a cycle's votes to the timelock for execution
     * this function begins the process of executing the outcome of the vote by finalizing the outcome of voting in a completed cycle
     * @param _cycle the cycle to finalize
     */
    function compute(uint256 _cycle) external cycleComplete(_cycle) {
        // the proposal will be denoted as the leader, this could error if there was weeks of activity, this also hits the issue of far back execution so maybe needs to also be a mapping :augh:
        // the proposal itself can be deleted as a sign of completion (most gas efficient) to show that it's been executed
        // there can also be a field that forces it to be unexecutable later

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

    //     MonetaryPolicy storage p = proposals[currentCycle][address(0)];
    //     p.inflationMultiplier = IDEMPOTENT_INFLATION_MULTIPLIER;

    //     // sets the default votes for the default proposal
    //     score[address(0)] = trustedNodes.numTrustees();
    // }
}
