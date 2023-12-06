// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "../../currency/ECO.sol";
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

    /** the duration of the community governance cycle */
    uint256 public constant CYCLE_LENGTH = 14 days;

    /** the duration of the proposal stage */
    uint256 public constant PROPOSAL_LENGTH = 9 days;

    /** the duration of the voting stage */
    uint256 public constant VOTING_LENGTH = 3 days;

    /** the duration of the execution delay */
    uint256 public constant DELAY_LENGTH = 1 days;

    /** address allowed to pause community governance */
    address public pauser;

    /** reference any proposal by its address*/
    mapping(address => PropData) public proposals;

    /** number of voting cycles since launch */
    uint256 public cycleCount;

    /** start of the current cycle */
    uint256 public cycleStart;

    /** current stage in the cycle */
    Stage public stage;

    /** end time of current */
    uint256 public currentStageEnd;

    /** snapshot block for calculating voting power */
    uint256 public snapshotBlock;

    /** cost in ECO to submit a proposal */
    uint256 public proposalFee = 10000;

    /** proposal fee to be refunded if proposal is not enacted */
    uint256 public feeRefund = 5000;

    /** the percent of total VP that must be supporting a proposal in order to advance it to the voting stage */
    uint256 public supportThresholdPercent = 15;

    /** the percent of total VP that must have voted to enact a proposal in order to bypass the delay period */
    uint256 public voteThresholdPercent = 50;

    /** total voting power for the cycle */
    uint256 public cycleTotalVotingPower;

    /** the proposal being voted on this cycle */
    address public selectedProposal;

    /** total votes to enact the selected proposal*/
    uint256 public totalEnactVotes;

    /** total votes to reject the selected proposal*/
    uint256 public totalRejectVotes;

    /** total votes to abstain from voting on the selected proposal*/
    uint256 public totalAbstainVotes;

    /** redeemable tokens from fees  */
    uint256 public pot;

    //////////////////////////////////////////////
    /////////////////// ERRORS ///////////////////
    //////////////////////////////////////////////

    /** thrown when non-pauser tries to call pause without permission */
    error OnlyPauser();

    /** thrown when a call is made during the wrong stage of Community Governance */
    error WrongStage();

    /** thrown when a proposal that already exists is proposed again */
    error DuplicateProposal();

    /** thrown when related argument arrays have differing lengths */
    error ArrayLengthMismatch();

    /** thrown when the voting power of a support or vote action is invalid */
    error BadVotingPower();

    /** thrown when unsupport is called without the caller having supported the proposal */
    error NoSupportToRevoke();

    /** thrown when vote is called with a vote type other than enact, reject, abstain */
    error BadVoteType();

    /**
     * thrown when refund is called on a proposal for which no refund is available
     * @param proposal the proposal whose refund was attempted
     */
    error NoRefundAvailable(address proposal);

    /**
     * thrown when refund is called on a proposal that was submitted in the current cycle
     * @param proposal the proposal whose refund was attempted
     */
    error NoRefundDuringCycle(address proposal);

    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

    /**
     * event indicating the pauser was updated
     * @param pauser The new pauser
     */
    event PauserAssignment(address indexed pauser);

    /**
     * event indicating a change in the community governance stage
     * @param stage the new stage
     */
    event StageUpdated(Stage stage);

    /**
     * An event indicating a proposal has been registered
     * @param proposer The address that submitted the proposal
     * @param proposal The address of the proposal contract instance that was added
     */
    event ProposalRegistration(address proposer, Proposal proposal);

    /**
     * An event indicating a change in support for a proposal
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
     * An event indicating a vote cast on a proposal
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
     * An event indicating that the proposal selected for this governance cycle was successfully executed
     * @param proposal The proposal that was executed
     */
    event ExecutionComplete(address proposal);

    /**
     * An event indicating that a new cycle has begun
     * @param cycleNumber the cycle number
     */
    event NewCycle(uint256 cycleNumber);

    /**
     An event indicating that the fee for a proposal was refunded
     * @param proposal The address of the proposal being refunded
     * @param proposer The address that registered the proposal
     * @param refund The amount of tokens refunded to proposer
     */
    event FeeRefunded(address proposal, address proposer, uint256 refund);

    /**
     * An event indicating that the leftover funds from fees were swept to a recipient address
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
     * contract constructor
     * @param policy the root policy address
     * @param _eco the ECO contract address
     * @param _ecoXStaking the ECOxStaking contract address
     * @param _pauser the new pauser
     * @param _cycleStart the time that the first cycle should begin
     */
    constructor(
        Policy policy,
        ECO _eco,
        ECOxStaking _ecoXStaking,
        uint256 _cycleStart,
        address _pauser
    ) VotingPower(policy, _eco, _ecoXStaking) {
        pauser = _pauser;
        cycleCount = 1000;
        currentStageEnd = _cycleStart;
    }

    /**
     * sets the pauser of community governance
     * @param _pauser the new pauser
     */
    function setPauser(address _pauser) public onlyPolicy {
        pauser = _pauser;
        emit PauserAssignment(_pauser);
    }

    /**
     * Pauses community governance
     */
    function pause() external onlyPauser {
        _pause();
    }

    /**
     * updates the current stage
     * called by methods propose, vote, and execute.
     */
    function updateStage() public {
        uint256 time = getTime();
        if (time > currentStageEnd) {
            if (stage == Stage.Proposal) {
                // no proposal was selected
                stage = Stage.Done;
                currentStageEnd = cycleStart + CYCLE_LENGTH;
            } else if (stage == Stage.Voting) {
                if (totalEnactVotes > totalRejectVotes) {
                    // vote passes
                    stage = Stage.Delay;
                    currentStageEnd = time + DELAY_LENGTH;
                } else {
                    // vote fails
                    stage = Stage.Done;
                    currentStageEnd = cycleStart + CYCLE_LENGTH;
                }
            } else if (stage == Stage.Delay) {
                // delay period ended, time to execute
                stage = Stage.Execution;
                //three additional days, ensuring a minimum of three days and eight hours to enact the proposal, after which it will need to be resubmitted.
                currentStageEnd = cycleStart + CYCLE_LENGTH;
            } else if (stage == Stage.Execution) {
                // if the execution stage timed out, the proposal was not enacted in time
                // either nobody called it, or the proposal failed during execution.
                // this assumes the latter case, the former has been addressed in the end time of the execution stage
                stage = Stage.Done;
                nextCycle();
            } else if (stage == Stage.Done) {
                nextCycle();
            }

            emit StageUpdated(stage);
        }
    }

    /**
     * moves community governance to the next cycle
     */
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
            ecoToken.snapshot();
            stage = Stage.Proposal;
            currentStageEnd = cycleStart + PROPOSAL_LENGTH;
        } else {
            stage = Stage.Done;
            currentStageEnd = cycleStart + CYCLE_LENGTH;
        }
        snapshotBlock = block.number;
        cycleTotalVotingPower = totalVotingPower();
        delete selectedProposal;
        delete totalEnactVotes;
        delete totalRejectVotes;
        delete totalAbstainVotes;

        emit NewCycle(cycleCount);
    }

    /**
     * allows a user to submit a community governance proposal
     *
     * Register a new proposal for community review. Registration is necessary but does not guarantee a vote for its implementation. The proposal is stored in proposals which is an array of all submissions as well as allProposals which stores the proposal addresses. A Register event is emitted.
     *
     * Registering a proposal requires a deposit of 1000 ECO (COST_REGISTER), which is transferred from the caller's balance to this contract. An allowance for this transfer must be made before calling. If the proposal does not get voted on then the caller will be entitled to claim a refund of 800 ECO (REFUND_IF_LOST). If the Circuit Breaker is enacted, this registration fee is waived as transfers cannot be made. This will confuse the refund function, but that is deprioritized in the case of a circuit breaker emergency.
     *
     * **Security Notes**
     *
     * - Can only be called during the proposing period.
     * - Requires creating an allowance for payment to call to prevent abuse.
     * - You cannot propose the 0 address.
     * - A proposal can only be registered once, regardless of proposer.
     *
     *
     * @param _proposal the address of the deployed proposal
     * fee is only levied if community governance is paused - we want to still be usable
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
     * allows an address to register its full voting power in support of a proposal
     * @param _proposal the address of proposal to be supported
     */
    function support(address _proposal) public {
        uint256 vp = votingPower(msg.sender, snapshotBlock);
        _changeSupport(msg.sender, _proposal, vp);
    }

    /**
     * allows an address to register partial support for a set of proposals
     * @param _proposals the array of proposals to be supported
     * @param _allocations the respective voting power to put behind those proposals
     * _changeSupport overwrites the previous supporting voting power, so having the same proposal multiple times in the _proposals array will not result in double counting of support
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
        uint256 vp = votingPower(msg.sender, snapshotBlock);
        for (uint256 i = 0; i < length; i++) {
            uint256 theSupport = _allocations[i];
            if (theSupport > vp) {
                revert BadVotingPower();
            }
            _changeSupport(msg.sender, _proposals[i], theSupport);
        }
    }

    /**
     * allows an address to revoke support for a proposal
     * @param _proposal the address of proposal to be supported
     */
    function unsupport(address _proposal) public {
        // updateStage();
        if (stage != Stage.Proposal) {
            revert WrongStage();
        }

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
        uint256 theSupport = prop.support[supporter];

        emit SupportChanged(supporter, Proposal(proposal), theSupport, amount);

        prop.totalSupport -= theSupport;
        prop.support[supporter] = amount;
        prop.totalSupport += amount;

        if (
            prop.totalSupport >
            (cycleTotalVotingPower * supportThresholdPercent) / 100
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
     * fetches the voting power with which a given address supports a given proposal
     * @param supporter the supporting address
     * @param proposal the proposal
     8 @return theSupport voting power with which a given address supports a given proposal 
     */
    function getSupport(
        address supporter,
        address proposal
    ) public view returns (uint256 theSupport) {
        theSupport = proposals[proposal].support[supporter];
        return theSupport;
    }

    /**
     * allows an address to vote to enact, reject or abstain on a proposal with their full voting power
     * @param choice the address' vote
     */
    function vote(Vote choice) public {
        if (choice == Vote.Enact) {
            _vote(msg.sender, votingPower(msg.sender, snapshotBlock), 0, 0);
        } else if (choice == Vote.Reject) {
            _vote(msg.sender, 0, votingPower(msg.sender, snapshotBlock), 0);
        } else if (choice == Vote.Abstain) {
            _vote(msg.sender, 0, 0, votingPower(msg.sender, snapshotBlock));
        } else {
            revert BadVoteType();
        }
    }

    /**
     * allows an address to split their voting power allocation between enact, reject and abstain
     * @param enactVotes votes to enact
     * @param rejectVotes votes to reject
     * @param abstainVotes votes to abstain
     */
    function votePartial(
        uint256 enactVotes,
        uint256 rejectVotes,
        uint256 abstainVotes
    ) public {
        if (
            enactVotes + rejectVotes + abstainVotes >
            votingPower(msg.sender, snapshotBlock)
        ) {
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
            (cycleTotalVotingPower * voteThresholdPercent) / 100
        ) {
            stage = Stage.Execution;
            currentStageEnd = cycleStart + CYCLE_LENGTH;

            emit StageUpdated(Stage.Execution);
        }
    }

    /**
     * fetches the votes an address has pledged toward enacting, rejecting, and abstaining on a given proposal
     * @param voter the supporting address
     * @return enactVotes Votes for enacting the policy
     * @return rejectVotes Votes for rejecting the policy
     * @return abstainVotes Votes for abstaining on the policy
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
        // enactVotes = prop.enactVotes[voter];
        // rejectVotes = prop.rejectVotes[voter];
        // abstainVotes = prop.abstainVotes[voter];
        // return (enactVotes, rejectVotes, abstainVotes);
        return (
            prop.enactVotes[voter],
            prop.rejectVotes[voter],
            prop.abstainVotes[voter]
        );
    }

    /**
     * allows an address to enact a selected proposal that has passed the vote
     * it is important to do this in a timely manner, once the cycle passes it will no longer be possible to execute the proposal.
     * the community will have a minimum of 3 days 8 hours to enact the proposal.
     */
    function execute() public {
        updateStage();
        if (stage != Stage.Execution) {
            revert WrongStage();
        }

        policy.enact(selectedProposal);
        stage = Stage.Done;

        emit ExecutionComplete(selectedProposal);
    }

    /**
     * allows redemption of proposal registration fees
     * @param proposal the proposal whose fee is being redeemed
     * the fee will be refunded to the proposer of the proposal, regardless of who calls refund
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
     * allows the leftover registration fees to be drained from the contract
     * @param recipient the address receiving the tokens
     * only the policy contract can call this
     */
    function sweep(address recipient) public onlyPolicy {
        uint256 pan = pot;
        pot = 0;
        ecoToken.transfer(recipient, pan);
        emit Sweep(recipient);
    }
}
