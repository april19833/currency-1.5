// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TrustedNodes.sol";
import "./MonetaryPolicyAdapter.sol";
import "../../utils/TimeUtils.sol";
import "../../policy/Policed.sol";

/**
 * @title Trustee monetary policy decision process
 * @notice This contract oversees the voting on the currency monetary levers.
 * Trustees vote on a policy that is implemented at the conclusion of the cycle
 */
contract CurrencyGovernance is Policed, TimeUtils {
    //////////////////////////////////////////////
    /////////////////// TYPES ////////////////////
    //////////////////////////////////////////////

    // data structure for monetary policy proposals
    struct MonetaryPolicy {
        // the cycle that the proposal was submitted during
        uint256 cycle;
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
    }

    // struct for the array of submitted votes
    struct Vote {
        // the address of the trustee who submitted the proposal being voted for
        // proposals must be scored in ascending order of address to be accepted
        bytes32 proposalId;
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

    //
    MonetaryPolicyAdapter public enacter;

    // this variable tracks the start of governance
    // it is use to track the voting cycle and stage
    uint256 public immutable governanceStartTime;

    // timescales
    uint256 public constant PROPOSAL_TIME = 10 days;
    uint256 public constant VOTING_TIME = 3 days;
    uint256 public constant REVEAL_TIME = 1 days;
    uint256 public constant CYCLE_LENGTH =
        PROPOSAL_TIME + VOTING_TIME + REVEAL_TIME;

    // start with cycle 1000 to avoid underflow and initial value issues
    uint256 public constant START_CYCLE = 1000;

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
    mapping(address => uint256) public trusteeSupports;
    // mapping of trustee addresses to their most recent hash commits for voting
    mapping(address => bytes32) public commitments;
    // mapping proposalIds to their voting score, accumulated during reveal
    mapping(bytes32 => uint256) public scores;

    /** used to track the leading proposalId during the vote totalling
     * tracks the winner between reveal phases
     * is deleted on enact to ensure it can only be enacted once
     */
    bytes32 public leader;

    //////////////////////////////////////////////
    /////////////////// ERRORS ///////////////////
    //////////////////////////////////////////////

    // setting the trusted nodes address to the zero address stops governance
    error NonZeroTrustedNodesAddr();

    // setting the enacter address to the zero address stops governance
    error NonZeroEnacterAddr();

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

    // error for when a reveal is submitted with no votes
    error CannotVoteEmpty();

    // error for when a trustee with a commmitment tries to abstain
    error NoAbstainWithCommit();

    // error for when a reveal is submitted for an empty commitment, usually the sign of no commit being submitted
    error NoCommitFound();

    // error for when the submitted vote doesn't match the stored commit
    error CommitMismatch();

    /** error for when a proposalId in a trustee's vote is not one from the current cycle or is completely invalid
     * @param vote the vote containing the invalid proposalId
     */
    error InvalidVoteBadProposalId(Vote vote);

    /** error for when the proposalIds in a trustee's vote are not strictly increasing
     * @param prevVote the vote before the invalid vote
     * @param vote the vote with the non-increasing proposalId
     */
    error InvalidVoteBadProposalOrder(Vote prevVote, Vote vote);

    /** error for when a score in a trustee's vote is either duplicate or doesn't respect support weightings
     * @param vote the vote containing the invalid score
     */
    error InvalidVoteBadScore(Vote vote);

    // error for when the scores for proposals are not monotonically increasing, accounting for support weighting
    error InvalidVotesOutOfBounds();

    // error for when enact is called, but the cycle it's called for does not match the proposal that's the current leader
    error EnactCycleNotCurrent();

    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

    /**
     * emits when the trustedNodes contract is changed
     * @param newTrustedNodes denotes the new trustedNodes contract address
     * @param oldTrustedNodes denotes the old trustedNodes contract address
     */
    event NewTrustedNodes(
        TrustedNodes newTrustedNodes,
        TrustedNodes oldTrustedNodes
    );

    /**
     * emits when the enacter contract is changed
     * @param newEnacter denotes the new enacter contract address
     * @param oldEnacter denotes the old enacter contract address
     */
    event NewEnacter(
        MonetaryPolicyAdapter newEnacter,
        MonetaryPolicyAdapter oldEnacter
    );

    /** Tracking for proposal creation
     * emitted when a proposal is submitted to track the values
     * @param _trusteeAddress the address of the trustee that submitted the proposal
     * @param _cycle the cycle during which the proposal was submitted
     * @param id the lookup id for the proposal in the proposals mapping
     * is created via a hash of _cycle, _targets, _signatures, and _calldatas; see getProposalHash for more details
     * @param _description a string allowing the trustee to describe the proposal or link to discussions on the proposal
     */
    event ProposalCreation(
        address indexed _trusteeAddress,
        uint256 indexed _cycle,
        bytes32 id,
        string _description
    );

    /** Tracking for support actions
     * emitted when a trustee adds their support for a proposal
     * @param trustee the address of the trustee supporting
     * @param proposalId the lookup for the proposal being supported
     * @param cycle the cycle during which the support action happened
     */
    event Support(
        address indexed trustee,
        bytes32 indexed proposalId,
        uint256 indexed cycle
    );

    /** Tracking for unsupport actions
     * emitted when a trustee retracts their support for a proposal
     * @param trustee the address of the trustee unsupporting
     * @param proposalId the lookup for the proposal being unsupported
     * @param cycle the cycle during which the support action happened
     */
    event Unsupport(
        address indexed trustee,
        bytes32 indexed proposalId,
        uint256 indexed cycle
    );

    /** Tracking for removed proposals
     * emitted when the last trustee retracts their support for a proposal
     * @param proposalId the lookup for the proposal being deleted
     * @param cycle the cycle during which the unsupport deletion action happened
     */
    event ProposalDeleted(bytes32 indexed proposalId, uint256 indexed cycle);

    /** Fired when a trustee commits their vote.
     * @param trustee the trustee that committed the vote
     * @param cycle the cycle for the commitment
     */
    event VoteCommit(address indexed trustee, uint256 indexed cycle);

    /** Fired when a vote is revealed, to create a voting history for all participants.
     * Records the voter, as well as all of the parameters of the vote cast.
     * @param voter the trustee who revealed their vote
     * @param cycle the cycle when the vote was cast and counted
     * @param votes the array of Vote structs that composed the trustee's ballot
     */
    event VoteReveal(
        address indexed voter,
        uint256 indexed cycle,
        Vote[] votes
    );

    /** Fired when an address choses to abstain
     */
    event Abstain(address indexed voter, uint256 indexed cycle);

    /** Fired when vote results are computed, creating a permanent record of vote outcomes.
     * @param cycle the cycle for which this is the vote result
     * @param winner the proposalId for the proposal that won
     */
    event VoteResult(uint256 cycle, bytes32 winner);

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
        uint256 completedCycles = START_CYCLE +
            (getTime() - governanceStartTime) /
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
     */
    constructor(
        Policy _policy,
        MonetaryPolicyAdapter _enacter
    ) Policed(_policy) {
        _setEnacter(_enacter);
        governanceStartTime = getTime();
    }

    //////////////////////////////////////////////
    ////////////////// FUNCTIONS /////////////////
    //////////////////////////////////////////////

    /** setter function for trustedNodes var
     * only available to the owning policy contract
     * @param _trustedNodes the value to set the new trustedNodes address to, cannot be zero
     */
    function setTrustedNodes(TrustedNodes _trustedNodes) external onlyPolicy {
        emit NewTrustedNodes(_trustedNodes, trustedNodes);
        _setTrustedNodes(_trustedNodes);
    }

    function _setTrustedNodes(TrustedNodes _trustedNodes) internal {
        if (address(_trustedNodes) == address(0)) {
            revert NonZeroTrustedNodesAddr();
        }
        trustedNodes = _trustedNodes;
    }

    /** setter function for enacter var
     * only available to the owning policy contract
     * @param _enacter the value to set the new enacter address to, cannot be zero
     */
    function setEnacter(MonetaryPolicyAdapter _enacter) external onlyPolicy {
        emit NewEnacter(_enacter, enacter);
        _setEnacter(_enacter);
    }

    function _setEnacter(MonetaryPolicyAdapter _enacter) internal {
        if (address(_enacter) == address(0)) {
            revert NonZeroEnacterAddr();
        }
        enacter = _enacter;
    }

    /** getter for timing data
     * calculates and returns the current cycle and the current stage
     * @return TimingData type of { uint256 cycle, Stage stage }
     */
    function getCurrentStage() public view returns (TimingData memory) {
        uint256 timeDifference = getTime() - governanceStartTime;
        uint256 completedCycles = START_CYCLE + timeDifference / CYCLE_LENGTH;
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
        return START_CYCLE + (getTime() - governanceStartTime) / CYCLE_LENGTH;
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
        if (!canSupport(msg.sender)) {
            revert SupportAlreadyGiven();
        }

        trusteeSupports[msg.sender] = cycle;

        uint256 descriptionLength = bytes(description).length;
        if (descriptionLength > MAX_DESCRIPTION_DATA) {
            revert ExceedsMaxDescriptionSize(descriptionLength);
        }

        uint256 numTargets = targets.length;
        if (numTargets > MAX_TARGETS || numTargets <= 0) {
            revert BadNumTargets(numTargets);
        }
        if (numTargets != signatures.length || numTargets != calldatas.length) {
            revert ProposalActionsArrayMismatch();
        }

        bytes32 proposalId = getProposalId(
            cycle,
            targets,
            signatures,
            calldatas
        );

        MonetaryPolicy storage p = proposals[proposalId];

        // THIS IS NOT A GUARANTEE FOR DUPLICATE PROPOSALS JUST A SAFEGUARD FOR OVERWRITING
        if (p.support != 0) {
            revert DuplicateProposal();
        }
        p.support = 1;
        p.supporters[msg.sender] = true;

        p.cycle = cycle;
        p.targets = targets;
        p.signatures = signatures;
        p.calldatas = calldatas;
        p.description = description;

        emit ProposalCreation(msg.sender, cycle, proposalId, description);
        emit Support(msg.sender, proposalId, cycle);
    }

    /** getter for duplicate support checks
     * the function just pulls to see if the address has supported this generation
     * doesn't check to see if the address is a trustee
     * @param _address the address to check. not msg.sender for dapp related purposes
     */
    function canSupport(address _address) public view returns (bool) {
        return trusteeSupports[_address] < getCurrentCycle();
    }

    function getProposalId(
        uint256 _cycle,
        address[] calldata _targets,
        bytes4[] calldata _signatures,
        bytes[] memory _calldatas
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    _cycle,
                    keccak256(abi.encode(_targets, _signatures, _calldatas))
                )
            );
    }

    function getProposalTargets(
        bytes32 proposalId
    ) external view returns (address[] memory) {
        return proposals[proposalId].targets;
    }

    function getProposalSignatures(
        bytes32 proposalId
    ) external view returns (bytes4[] memory) {
        return proposals[proposalId].signatures;
    }

    function getProposalCalldatas(
        bytes32 proposalId
    ) external view returns (bytes[] memory) {
        return proposals[proposalId].calldatas;
    }

    function getProposalSupporter(
        bytes32 proposalId,
        address supporter
    ) external view returns (bool) {
        return proposals[proposalId].supporters[supporter];
    }

    /** add your support to a monetary policy
     * this function allows you to increase the support weight to an already submitted proposal
     * the submitter of a proposal default supports it
     * support for a proposal is close to equivalent of submitting a duplicate proposal to pad the ranking
     * need to link to borda count analysis by christian here
     * @param proposalId the lookup ID for the proposal that's being supported
     */
    function supportProposal(
        bytes32 proposalId
    ) external onlyTrusted duringProposePhase {
        if (!canSupport(msg.sender)) {
            revert SupportAlreadyGiven();
        }

        uint256 cycle = getCurrentCycle();

        trusteeSupports[msg.sender] = cycle;

        MonetaryPolicy storage p = proposals[proposalId];

        // can support the default proposal even though is doesn't get initialized
        // the support parameter is bumped by 1 for the default proposal when its vote is counted
        // cannot support future cycle default proposals
        if (p.support == 0 && proposalId != bytes32(cycle)) {
            revert NoSuchProposal();
        }
        // // actually should never trigger since SupportAlreadyGiven would throw first
        // if (p.supporters[msg.sender]) {
        //     revert DuplicateSupport();
        // }

        ++p.support;
        p.supporters[msg.sender] = true;
        emit Support(msg.sender, proposalId, getCurrentCycle());
    }

    /** removes your support to a monetary policy
     * this function allows you to reduce the support weight to an already submitted proposal
     * you must unsupport first if you currently have supported if you want to support or propose another proposal
     * the last person who unsupports the proposal deletes the proposal
     * @param proposalId the lookup ID for the proposal that's being unsupported
     */
    function unsupportProposal(
        bytes32 proposalId
    ) external onlyTrusted duringProposePhase {
        uint256 cycle = getCurrentCycle();

        MonetaryPolicy storage p = proposals[proposalId];
        uint256 support = p.support;

        if (support == 0) {
            revert NoSuchProposal();
        }
        if (!p.supporters[msg.sender]) {
            revert SupportNotGiven();
        }

        p.supporters[msg.sender] = false;

        // deleting the default proposal doesn't do anything, but you don't want to emit the event
        if (support == 1 && proposalId != bytes32(cycle)) {
            delete proposals[proposalId];
            emit ProposalDeleted(proposalId, cycle);
        } else {
            --p.support;
        }

        trusteeSupports[msg.sender] = 0;
        emit Unsupport(msg.sender, proposalId, cycle);
    }

    /** submit a vote commitment
     * this function allows trustees to submit a commit hash of their vote
     * commitment is salted so that it is a blind vote process
     * calling additional times overwrites previous commitments
     * @param _commitment the hash commit to check against when revealing
     * the structure of the commit is keccak256(abi.encode(salt, cycleIndex, msg.sender, votes)) where votes is an array of Vote structs
     */
    function commit(bytes32 _commitment) external onlyTrusted duringVotePhase {
        commitments[msg.sender] = _commitment;
        emit VoteCommit(msg.sender, getCurrentCycle());
    }

    /** signal abstainment to the protocol
     * does not count as a vote (cannot be revealed to record positive participation for a reward)
     * signals the abstainment with an event
     * due to a small quirk, forgetting to reveal your vote in the previous round requires you to first call commit with zero data
     */
    function abstain() external onlyTrusted duringVotePhase {
        if (commitments[msg.sender] != bytes32(0)) {
            revert NoAbstainWithCommit();
        }
        emit Abstain(msg.sender, getCurrentCycle());
    }

    /** reveal a committed vote
     * this function allows trustees to reveal their previously committed votes once the reveal phase is entered
     * in revealing the vote, votes are tallied, a running tally of each proposal's votes is kept in storage during this phase
     * @param _trustee the trustee's commit to try and reveal
     * trustees can obviously reveal their own commits, but this allows for a delegated reveal
     * the commit structure means that only the correct committed vote can ever be revealed, no matter who reveals it
     * reveals are attributed to this trustee
     * @param _salt the salt for the commit hash to make the vote secret
     * @param _votes the array of Vote objects { bytes32 proposal, uint256 ranking } that follows our modified Borda scheme. The votes need to be arranged in ascending order of address and ranked via the integers 1 to the number of proposals ranked.
     */
    function reveal(
        address _trustee,
        bytes32 _salt,
        Vote[] calldata _votes
    ) external duringRevealPhase {
        uint256 _cycle = getCurrentCycle();
        uint256 numVotes = _votes.length;
        if (numVotes == 0) {
            revert CannotVoteEmpty();
        }
        if (
            keccak256(abi.encode(_salt, _cycle, _trustee, _votes)) !=
            commitments[_trustee]
        ) {
            revert CommitMismatch();
        }

        // an easy way to prevent double counting votes
        delete commitments[_trustee];

        // use memory vars to store and track the changes of the leader
        bytes32 priorLeader = leader;
        bytes32 leaderTracker = priorLeader;
        uint256 leaderRankTracker = 0;

        /**
         * this variable is a bitmap to check that the scores in the ballot are correct
         */
        uint256 scoreDuplicateCheck = 0;

        uint256 i = 0;
        Vote calldata firstV = _votes[0];
        bytes32 firstProposalId = firstV.proposalId;
        // the default proposal will be first every time as its identifier has so many leading zeros that the likelyhood of a proposalId having more leading zeros is astronomically small
        if (firstProposalId == bytes32(_cycle)) {
            uint256 firstScore = firstV.score;
            uint256 _support = proposals[firstProposalId].support + 1; // default proposal has one more support than recorded in storage
            if (_support > firstScore) {
                revert InvalidVoteBadScore(firstV);
            }
            // the only bad score for the duplicate check would be score of zero which is disallowed by the previous conditional
            // so we don't need to check duplicates, just record the amount
            scoreDuplicateCheck +=
                (2 ** _support - 1) <<
                (firstScore - _support);
            scores[firstProposalId] += firstScore;
            // can simplify the leader rank tracker check because we know it's the first element
            if (scores[firstProposalId] >= scores[leaderTracker]) {
                leaderTracker = firstProposalId;
                leaderRankTracker = firstScore;
            }

            // make sure to skip the first element in the following loop as it has already been handled
            i++;
        }

        for (; i < numVotes; ++i) {
            Vote calldata v = _votes[i];
            bytes32 _proposalId = v.proposalId;
            uint256 _score = v.score;
            MonetaryPolicy storage p = proposals[_proposalId];

            if (p.cycle != _cycle) {
                revert InvalidVoteBadProposalId(v);
            }
            if (i != 0 && _votes[i - 1].proposalId >= _proposalId) {
                revert InvalidVoteBadProposalOrder(_votes[i - 1], v);
            }

            uint256 _support = p.support;
            if (_support > _score) {
                revert InvalidVoteBadScore(v);
            }
            uint256 duplicateCompare = (2 ** _support - 1) <<
                (_score - _support);

            if (scoreDuplicateCheck & duplicateCompare > 0) {
                revert InvalidVoteBadScore(v);
            }

            scoreDuplicateCheck += duplicateCompare;

            // now that the scores have been ensured to respect supporting, the previous leader calculation method is still valid
            scores[_proposalId] += _score;
            if (scores[_proposalId] > scores[leaderTracker]) {
                leaderTracker = _proposalId;
                leaderRankTracker = _score;
            } else if (scores[_proposalId] == scores[leaderTracker]) {
                if (_score > leaderRankTracker) {
                    leaderTracker = _proposalId;
                    leaderRankTracker = _score;
                }
            }
        }

        // this check afterward is very important to understand
        // it makes sure that the votes have been sequentially increasing and have been respecting the support values of each proposal
        // the only way this check succeeds is if scoreDuplicate check is of the form 1111111111etc in its binary representation after all the votes from the ballot are in
        if (scoreDuplicateCheck & (scoreDuplicateCheck + 1) > 0) {
            revert InvalidVotesOutOfBounds();
        }

        // only changes the leader if the new leader is of greater score
        if (
            leaderTracker != priorLeader &&
            scores[leaderTracker] > scores[priorLeader]
        ) {
            leader = leaderTracker;
        }

        // record the trustee's vote for compensation purposes
        trustedNodes.recordVote(_trustee);

        emit VoteReveal(_trustee, _cycle, _votes);
    }

    /** send the results to the adapter for enaction
     * @param _cycle cycle index must match the cycle just completed as denoted on the proposal marked by the leader variable
     */
    function enact(uint256 _cycle) external cycleComplete(_cycle) {
        bytes32 _leader = leader;
        // this ensures that this function can only be called once per winning MP
        // however it doesn't allow compute to be re-called if there's a downstream non-reverting failure
        // this is by design
        delete leader;

        // the default proposal doesn't do anything
        if (_leader == bytes32(_cycle)) {
            emit VoteResult(_cycle, _leader); // included for completionist's sake, will likely never be called
            return;
        }

        MonetaryPolicy storage _winner = proposals[_leader];

        if (_winner.cycle != _cycle) {
            revert EnactCycleNotCurrent();
        }

        enacter.enact(
            _leader,
            _winner.targets,
            _winner.signatures,
            _winner.calldatas
        );

        emit VoteResult(_cycle, _leader);
    }
}
