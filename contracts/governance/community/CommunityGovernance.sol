// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "./VotingPower.sol";
import "./ECOxStaking.sol";
import "./proposals/Proposal.sol";

contract CommunityGovernance is VotingPower, Pausable, TimeUtils {
    //////////////////////////////////////////////
    /////////////////// TYPES ////////////////////
    //////////////////////////////////////////////
    struct PropData {
        uint256 cycle;
        address proposer;
        uint256 totalSupport;
        uint256 refund;
        mapping(address => uint256) support;
        // considering putting these into a double mapping cycle -> address -> votes in CommunityGovernance, will check gas on this later
        mapping(address => uint256) enactVotes;
        mapping(address => uint256) rejectVotes;
        mapping(address => uint256) abstainVotes;
    }

    enum Stage {
        Done, // Done should be the default stage
        Proposal,
        Voting,
        Delay,
        Execution
    }

    enum Vote {
        Reject,
        Enact,
        Abstain
    }

    //////////////////////////////////////////////
    //////////////////// VARS ////////////////////
    //////////////////////////////////////////////

    /** @notice the duration of the community governance cycle */
    uint256 public constant CYCLE_LENGTH = 28 minutes;

    /** @notice the duration of the proposal stage */
    uint256 public constant PROPOSAL_LENGTH = 18 minutes;

    /** @notice the duration of the voting stage */
    uint256 public constant VOTING_LENGTH = 6 minutes;

    /** @notice the duration of the execution delay */
    uint256 public constant DELAY_LENGTH = 2 minutes;

    /** @notice the duration of the execution window beyond the cycle end */
    uint256 public constant EXECUTION_EXTRA_LENGTH = 2 minutes;

    /** @notice address allowed to pause community governance */
    address public pauser;

    /** @notice reference any proposal by its address*/
    mapping(address => PropData) public proposals;

    /** @notice number of voting cycles since launch */
    uint256 public cycleCount;

    /** @notice start of the current cycle */
    uint256 public cycleStart;

    /** @notice current stage in the cycle */
    Stage public stage;

    /** @notice end time of current */
    uint256 public currentStageEnd;

    /** @notice cost in ECO to submit a proposal */
    uint256 public proposalFee = 10000;

    /** @notice proposal fee to be refunded if proposal is not enacted */
    uint256 public feeRefund = 5000;

    /** @notice the percent of total VP that must be supporting a proposal in order to advance it to the voting stage */
    uint256 public supportThresholdPercent = 15;

    /** @notice the percent of total VP that must have voted to enact a proposal in order to bypass the delay period */
    uint256 public voteThresholdPercent = 50;

    /** @notice the proposal being voted on this cycle */
    address public selectedProposal;

    /** @notice total votes to enact the selected proposal*/
    uint256 public totalEnactVotes;

    /** @notice total votes to reject the selected proposal*/
    uint256 public totalRejectVotes;

    /** @notice total votes to abstain from voting on the selected proposal*/
    uint256 public totalAbstainVotes;

    /** @notice redeemable tokens from fees  */
    uint256 public pot;

    //////////////////////////////////////////////
    /////////////////// ERRORS ///////////////////
    //////////////////////////////////////////////

    /** @notice thrown when non-pauser tries to call pause without permission */
    error OnlyPauser();

    /** @notice thrown when a call is made during the wrong stage of Community Governance */
    error WrongStage();

    /** @notice thrown when a proposal that already exists is proposed again */
    error DuplicateProposal();

    /** @notice thrown when there is an attempt to support a proposal submitted in a non-current cycle */
    error OldProposalSupport();

    /** @notice thrown when related argument arrays have differing lengths */
    error ArrayLengthMismatch();

    /** @notice thrown when the voting power of a support or vote action is invalid */
    error BadVotingPower();

    /** @notice thrown when unsupport is called without the caller having supported the proposal */
    error NoSupportToRevoke();

    /** @notice thrown when vote is called with a vote type other than enact, reject, abstain */
    error BadVoteType();

    /**
     * @notice thrown when refund is called on a proposal for which no refund is available
     * @param proposal the proposal whose refund was attempted
     */
    error NoRefundAvailable(address proposal);

    /**
     * @notice thrown when refund is called on a proposal that was submitted in the current cycle
     * @param proposal the proposal whose refund was attempted
     */
    error NoRefundDuringCycle(address proposal);

    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

    /**
     * @notice event indicating the pauser was updated
     * @param pauser The new pauser
     */
    event PauserAssignment(address indexed pauser);

    /**
     * @notice event indicating a change in the community governance stage
     * @param stage the new stage
     */
    event StageUpdated(Stage stage);

    /**
     * @notice An event indicating a proposal has been registered
     * @param proposer The address that submitted the proposal
     * @param proposal The address of the proposal contract instance that was added
     */
    event ProposalRegistration(address proposer, Proposal proposal);

    /**
     * @notice An event indicating a change in support for a proposal
     * @param supporter The address that submitted the proposal
     * @param proposal The address of the proposal contract instance that was added
     * @param oldSupport The previous amount of support
     * @param newSupport The new amount of support
     */
    event SupportChanged(
        address indexed supporter,
        Proposal indexed proposal,
        uint256 oldSupport,
        uint256 newSupport
    );

    /**
     * @notice An event indicating a vote cast on a proposal
     * @param voter The address casting votes
     * @param enactVotes The votes to enact
     * @param rejectVotes The votes to reject
     * @param abstainVotes The votes to abstain
     */
    event VotesChanged(
        address indexed voter,
        uint256 enactVotes,
        uint256 rejectVotes,
        uint256 abstainVotes
    );

    /**
     * @notice An event indicating that the proposal selected for this governance cycle was successfully executed
     * @param proposal The proposal that was executed
     */
    event ExecutionComplete(address proposal);

    /**
     * @notice An event indicating that a new cycle has begun
     * @param cycleNumber the cycle number
     */
    event NewCycle(uint256 cycleNumber);

    /**
     @notice An event indicating that the fee for a proposal was refunded
     @param proposal The address of the proposal being refunded
     @param proposer The address that registered the proposal
     @param refund The amount of tokens refunded to proposer
     */
    event FeeRefunded(address proposal, address proposer, uint256 refund);

    /**
     * @notice An event indicating that the leftover funds from fees were swept to a recipient address
     * @param recipient the recipient address
     */
    event Sweep(address recipient);

    modifier onlyPauser() {
        if (msg.sender != pauser) {
            revert OnlyPauser();
        }
        _;
    }

    /**
     * @notice contract constructor
     * @param policy the root policy address
     * @param _eco the ECO contract address
     * @param _ecoXStaking the ECOxStaking contract address
     * @param _pauser the new pauser
     * @param _cycleStart the time that the first cycle should begin
     */
    constructor(
        Policy policy,
        ECO _eco,
        ECOx _ecox,
        ECOxStaking _ecoXStaking,
        uint256 _cycleStart,
        address _pauser
    ) VotingPower(policy, _eco, _ecox, _ecoXStaking) {
        pauser = _pauser;
        cycleCount = 1000;
        currentStageEnd = _cycleStart;
    }

    /**
     * @notice sets the pauser of community governance
     * @param _pauser the new pauser
     */
    function setPauser(address _pauser) public onlyPolicy {
        pauser = _pauser;
        emit PauserAssignment(_pauser);
    }

    /**
     * @notice Pauses community governance
     */
    function pause() external onlyPauser {
        _pause();
    }

    /**
     * @notice updates the current stage
     * @dev called by methods propose, vote, and execute.
     */
    function updateStage() public {
        uint256 time = getTime();
        bool emitEvent;

        if (stage == Stage.Proposal && time > currentStageEnd) {
            // no proposal was selected
            stage = Stage.Done;
            currentStageEnd = cycleStart + CYCLE_LENGTH;
            emitEvent = true;
        }

        if (stage == Stage.Voting && time > currentStageEnd) {
            if (totalEnactVotes > totalRejectVotes) {
                // vote passes
                stage = Stage.Delay;
                currentStageEnd = currentStageEnd + DELAY_LENGTH;
            } else {
                // vote fails
                stage = Stage.Done;
                currentStageEnd = cycleStart + CYCLE_LENGTH;
            }
            emitEvent = true;
        }

        if (stage == Stage.Delay && time > currentStageEnd) {
            // delay period ended, time to execute
            stage = Stage.Execution;
            //one additional day, ensuring a minimum of two days to enact the proposal, after which it will need to be resubmitted.
            currentStageEnd =
                cycleStart +
                CYCLE_LENGTH +
                EXECUTION_EXTRA_LENGTH;
            emitEvent = true;
        }

        if (stage == Stage.Execution && time > currentStageEnd) {
            // if the execution stage timed out, the proposal was not enacted in time
            // either nobody called it, or the proposal failed during execution.
            // this assumes the latter case, the former has been addressed in the end time of the execution stage
            stage = Stage.Done;
            nextCycle();
            emitEvent = true;
        }

        if (stage == Stage.Done && time > currentStageEnd) {
            nextCycle();
            emitEvent = true;
        }

        // this saves the event spam
        if (emitEvent) {
            emit StageUpdated(stage);
        }
    }

    /** @notice moves community governance to the next cycle */
    function nextCycle() internal {
        if (stage != Stage.Done) {
            revert WrongStage();
        }
        if (cycleStart == 0) {
            cycleStart = getTime() - CYCLE_LENGTH;
        }

        uint256 elapsed = getTime() - cycleStart;
        uint256 cycles = elapsed / CYCLE_LENGTH;
        uint256 cycleTime = elapsed % CYCLE_LENGTH;

        cycleStart += cycles * CYCLE_LENGTH;
        cycleCount += cycles;

        if (cycleTime < PROPOSAL_LENGTH) {
            stage = Stage.Proposal;
            currentStageEnd = cycleStart + PROPOSAL_LENGTH;
        } else {
            stage = Stage.Done;
            currentStageEnd = cycleStart + CYCLE_LENGTH;
        }

        ecoToken.snapshot();
        ecoXToken.snapshot();
        snapshotBlock = block.number;

        delete selectedProposal;
        delete totalEnactVotes;
        delete totalRejectVotes;
        delete totalAbstainVotes;

        emit NewCycle(cycleCount);
    }

    /**
     * @notice allows a user to submit a community governance proposal
     * @param _proposal the address of the deployed proposal
     * @dev fee is only levied if community governance is paused - we want to still be usable
     * in the event that ECO transfers are paused.
     */
    function propose(Proposal _proposal) public {
        updateStage();
        if (stage != Stage.Proposal) {
            revert WrongStage();
        }

        PropData storage prop = proposals[address(_proposal)];
        if (prop.proposer != address(0)) {
            revert DuplicateProposal();
        }
        prop.cycle = cycleCount;
        prop.proposer = msg.sender;

        if (!paused()) {
            ecoToken.transferFrom(msg.sender, address(this), proposalFee);
            prop.refund = feeRefund;
            pot += proposalFee - prop.refund;
        }

        emit ProposalRegistration(msg.sender, _proposal);
    }

    /**
     * @notice allows an address to register its full voting power in support of a proposal
     * @param _proposal the address of proposal to be supported
     */
    function support(address _proposal) public {
        uint256 vp = votingPower(msg.sender);
        if (vp == 0) {
            revert BadVotingPower();
        }
        _changeSupport(msg.sender, _proposal, vp);
    }

    /**
     * @notice allows an address to register partial support for a set of proposals
     * @param _proposals the array of proposals to be supported
     * @param _allocations the respective voting power to put behind those proposals
     * @dev _changeSupport overwrites the previous supporting voting power, so having the same proposal multiple times in the _proposals array will not result in double counting of support
     */
    function supportPartial(
        address[] memory _proposals,
        uint256[] memory _allocations
    ) public {
        uint256 length = _proposals.length;
        if (length != _allocations.length) {
            revert ArrayLengthMismatch();
        }

        // uint256 sumSupport = 0;
        uint256 vp = votingPower(msg.sender);
        for (uint256 i = 0; i < length; i++) {
            uint256 support = _allocations[i];
            if (support > vp) {
                revert BadVotingPower();
            }
            _changeSupport(msg.sender, _proposals[i], support);
        }
    }

    /**
     * @notice allows an address to revoke support for a proposal
     * @param _proposal the address of proposal to be supported
     */
    function unsupport(address _proposal) public {
        if (proposals[_proposal].support[msg.sender] > 0) {
            _changeSupport(msg.sender, _proposal, 0);
        } else {
            revert NoSupportToRevoke();
        }
    }

    function _changeSupport(
        address supporter,
        address proposal,
        uint256 amount
    ) internal {
        updateStage();
        if (stage != Stage.Proposal) {
            revert WrongStage();
        }

        PropData storage prop = proposals[proposal];
        if (prop.cycle != cycleCount) {
            revert OldProposalSupport();
        }
        uint256 support = prop.support[supporter];

        emit SupportChanged(supporter, Proposal(proposal), support, amount);

        prop.totalSupport -= support;
        prop.support[supporter] = amount;
        prop.totalSupport += amount;

        if (
            prop.totalSupport >
            (totalVotingPower() * supportThresholdPercent) / 100
        ) {
            selectedProposal = proposal;
            pot -= (proposalFee - prop.refund);
            prop.refund = proposalFee;
            stage = Stage.Voting;
            currentStageEnd = getTime() + VOTING_LENGTH;

            emit StageUpdated(Stage.Voting);
        }
    }

    /**
     * @notice fetches the voting power with which a given address supports a given proposal
     * @param supporter the supporting address
     * @param proposal the proposal
     */
    function getSupport(
        address supporter,
        address proposal
    ) public view returns (uint256 support) {
        return proposals[proposal].support[supporter];
    }

    /**
     * @notice allows an address to vote to enact, reject or abstain on a proposal with their full voting power
     * @param choice the address' vote
     */
    function vote(Vote choice) public {
        uint256 vp = votingPower(msg.sender);
        if (vp == 0) {
            revert BadVotingPower();
        }
        if (choice == Vote.Enact) {
            _vote(msg.sender, vp, 0, 0);
        } else if (choice == Vote.Reject) {
            _vote(msg.sender, 0, vp, 0);
        } else if (choice == Vote.Abstain) {
            _vote(msg.sender, 0, 0, vp);
        } else {
            revert BadVoteType();
        }
    }

    /**
     * @notice allows an address to split their voting power allocation between enact, reject and abstain
     * @param enactVotes votes to enact
     * @param rejectVotes votes to reject
     * @param abstainVotes votes to abstain
     */
    function votePartial(
        uint256 enactVotes,
        uint256 rejectVotes,
        uint256 abstainVotes
    ) public {
        if (enactVotes + rejectVotes + abstainVotes > votingPower(msg.sender)) {
            revert BadVotingPower();
        }
        _vote(msg.sender, enactVotes, rejectVotes, abstainVotes);
    }

    function _vote(
        address voter,
        uint256 _enactVotes,
        uint256 _rejectVotes,
        uint256 _abstainVotes
    ) internal {
        updateStage();
        if (stage != Stage.Voting) {
            revert WrongStage();
        }

        PropData storage prop = proposals[selectedProposal];

        totalEnactVotes -= prop.enactVotes[voter];
        totalRejectVotes -= prop.rejectVotes[voter];
        totalAbstainVotes -= prop.abstainVotes[voter];

        prop.enactVotes[voter] = _enactVotes;
        prop.rejectVotes[voter] = _rejectVotes;
        prop.abstainVotes[voter] = _abstainVotes;

        totalEnactVotes += _enactVotes;
        totalRejectVotes += _rejectVotes;
        totalAbstainVotes += _abstainVotes;

        emit VotesChanged(voter, _enactVotes, _rejectVotes, _abstainVotes);

        if (
            (totalEnactVotes) >
            (totalVotingPower() * voteThresholdPercent) / 100
        ) {
            stage = Stage.Execution;
            currentStageEnd =
                cycleStart +
                CYCLE_LENGTH +
                EXECUTION_EXTRA_LENGTH;

            emit StageUpdated(Stage.Execution);
        }
    }

    /**
     * @notice fetches the votes an address has pledged toward enacting, rejecting, and abstaining on a given proposal
     * @param voter the supporting address
     */
    function getVotes(
        address voter
    )
        public
        view
        returns (uint256 enactVotes, uint256 rejectVotes, uint256 abstainVotes)
    {
        if (stage != Stage.Voting) {
            revert WrongStage();
        }
        PropData storage prop = proposals[selectedProposal];
        return (
            prop.enactVotes[voter],
            prop.rejectVotes[voter],
            prop.abstainVotes[voter]
        );
    }

    /**
     * @notice allows an address to enact a selected proposal that has passed the vote
     * @dev it is important to do this in a timely manner, once the cycle passes it will no longer be possible to execute the proposal.
     * @dev the community will have a minimum of 3 days 8 hours to enact the proposal.
     */
    function execute() public {
        updateStage();
        if (stage != Stage.Execution) {
            revert WrongStage();
        }

        policy.enact(selectedProposal);
        stage = Stage.Done;
        currentStageEnd = cycleStart + CYCLE_LENGTH; // ensure that an early execution allows for an on-time start to the next cycle

        emit ExecutionComplete(selectedProposal);
    }

    /**
     * @notice allows redemption of proposal registration fees
     * @param proposal the proposal whose fee is being redeemed
     * @dev the fee will be refunded to the proposer of the proposal, regardless of who calls refund
     */
    function refund(address proposal) public {
        uint256 propRefund = proposals[proposal].refund;
        address proposer = proposals[proposal].proposer;
        if (propRefund > 0) {
            if (proposals[proposal].cycle < cycleCount) {
                ecoToken.transfer(proposer, propRefund);

                emit FeeRefunded(proposal, proposer, propRefund);

                proposals[proposal].refund = 0;
            } else {
                revert NoRefundDuringCycle(proposal);
            }
        } else {
            revert NoRefundAvailable(proposal);
        }
    }

    /**
     * @notice allows the leftover registration fees to be drained from the contract
     * @param recipient the address receiving the tokens
     * @dev only the policy contract can call this
     */
    function sweep(address recipient) public onlyPolicy {
        uint256 amount = pot;
        pot = 0;
        ecoToken.transfer(recipient, amount);
        emit Sweep(recipient);
    }
}
