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
        mapping(address => uint256) support;
    }
    
    enum Stage {
        Proposal,
        Voting,
        Delay, 
        Execution,
        Done
    }

    enum Vote {
        Enact,
        Reject,
        Abstain
    }

    //////////////////////////////////////////////
    //////////////////// VARS ////////////////////
    //////////////////////////////////////////////

    /** @notice the duration of the community governance cycle */
    uint256 public constant CYCLE_LENGTH = 14 days;

    /** @notice the duration of the proposal stage */
    uint256 public constant PROPOSAL_LENGTH = 9 days + 16 hours;

    /** @notice the duration of the voting stage */
    uint256 public constant VOTING_LENGTH = 3 days;

    /** @notice the duration of the execution delay */
    uint256 public constant DELAY_LENGTH = 1 days;

    /** @notice the duration of the execution stage */
    uint256 public constant EXECUTION_LENGTH = 8 hours;

    /** @notice ECOxStaking contract */
    ECOxStaking public immutable ecoXStaking;

    /** @notice address allowed to pause community governance */
    address public pauser;

    /** @notice reference any proposal by its address*/
    mapping(Proposal => PropData) proposals;

    /** @notice number of voting cycles since launch */
    uint256 public cycleCount;

    /** @notice start of the current cycle */
    uint256 public cycleStart;

    /** @notice current stage in the cycle */
    Stage public stage;

    /** @notice end time of current */
    uint256 public currentStageEnd;

    /** @notice snapshot block for calculating voting power */
    uint256 public snapshotBlock;

    /** @notice cost in ECO to submit a proposal */
    uint256 public proposalFee;

    /** @notice the percent of total VP that must be supporting a proposal in order to advance it to the voting stage */
    uint256 public supportThresholdPercent = 15;

    /** @notice the percent of total VP that must be supporting a proposal in order to enact t immediately */
    uint256 public voteThresholdPercent = 50;

    /** @notice total voting power for the cycle */
    uint256 public cycleTotalVotingPower;
    
    /** @notice mapping of an address to its votes to enact the selected proposal */
    mapping(address => uint256) votesEnact;

    /** @notice mapping of an address to its votes to reject the selected proposal */
    mapping(address => uint256) votesReject;

    /** @notice mapping of an address to its votes to abstain from voting on the selected proposal */
    mapping(address => uint256) votesAbstain;

    /** @notice total votes to enact the selected proposal*/
    uint256 public totalEnactVotes;

    /** @notice total votes to reject the selected proposal*/
    uint256 public totalRejectVotes;

    /** @notice total votes to abstain from voting on the selected proposal*/
    uint256 public totalAbstainVotes;

    /** @notice whether the selected proposal has been executed */
    bool public executed;
    //////////////////////////////////////////////
    /////////////////// ERRORS ///////////////////
    //////////////////////////////////////////////

    /** @notice thrown when non-pauser tries to call methods without permission */
    error OnlyPauser();

    /** @notice thrown when setPauser is called with the existing pauser address as an argument */
    error SamePauser();

    /** @notice thrown when nextCycle is called while the current cycle is still in progress */
    error CycleInProgress();

    /** @notice thrown when execute is called and the proposal has already been executed */
    error ExecutionAlreadyCompleted();

    /** @notice thrown when related argument arrays have differing lengths */
    error ArrayLengthMismatch();
    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

    /**
     * @notice An event indicating a proposal has been registered
     * @param proposer The address that submitted the Proposal
     * @param proposalAddress The address of the Proposal contract instance that was added
     */
    event ProposalRegistration(address indexed proposer, Proposal indexed proposalAddress);

    /**
     * @notice event indicating the pauser was updated
     * @param pauser The new pauser
     */
    event PauserAssignment(address indexed pauser);

    modifier onlyPauser() {
        require(msg.sender == pauser, "ERC20Pausable: not pauser");
        _;
    }

    /**
     * @notice contract constructor
     * @param policy the root policy address
     * @param _eco the ECO contract address
     * @param _pauser the ECOxStaking contract address
     * @param _pauser the new pauser
     */
    constructor(
        Policy policy,
        address _eco,
        address _ecoXStaking,
        address _pauser
    ) VotingPower(policy, ECO(_eco)) {
        ecoXStaking = ECOxStaking(_ecoXStaking);
        pauser = _pauser;
    }

    /**
     * @notice sets the pauser of community governance 
     * @param _pauser the new pauser
     */
    function setPauser(address _pauser) public onlyPolicy {
        if (pauser == _pauser) {
            revert SamePauser();
        }
        pauser = _pauser;
        emit PauserAssignment(_pauser);
    }

    /**
     * @notice Pauses community governance 
     */
    function pause() external onlyPauser() {
        _pause();
    }
    /**
     * @notice updates the current stage
     * @dev called by methods propose, vote, and execute.
     */
    function updateStage() public {
        uint256 time = getTime();
        if(time > currentStageEnd) {
            if(stage == Stage.Proposal) {
                // no proposal was selected
                stage = Stage.Done;
                currentStageEnd = cycleStart + CYCLE_LENGTH;
            } else if (stage == Stage.Voting) {
                if (true) {
                    // vote passes
                    currentStage = Stage.Delay;
                    currentStageEnd = time + DELAY_LENGTH;
                } else {
                    // vote fails
                    currentStage = Stage.Done;
                    currentStageEnd = cycleStart + CYCLE_LENGTH;
                }
            } else if (stage == Stage.Delay) {
                // delay period ended, time to execute
                currentStage = Stage.execute;
                currentStageEnd = time + EXECUTION_LENGTH;
            } else {
                nextCycle();
            }
        }
    }
    /** @notice moves community governance to the next cycle */
    function nextCycle() public {
        if (stage != Stage.Done) {
            revert WrongStage();
        }
        uint256 elapsed = getTime() - cycleStart();
        uint256 cycles = elapsed / CYCLE_LENGTH;

        cycleStart += cycles * CYCLE_LENGTH;
        cycleCount += cycles;
        cycleTime = elapsed % CYCLE_LENGTH;

        if (cycleTime < PROPOSAL_LENGTH) {
            stage = Stage.Proposal;
            currentStageEnd = cycleStart + PROPOSAL_LENGTH;
        } else {
            stage = stage.Done;
            currentStageEnd = cycleStart + CYCLE_LENGTH;
        }
        eco.snapshot();
        snapshotBlock = block.number;
        cycleTotalVotingPower = totalVotingPower();

    }

    /** 
     * @notice allows a user to submit a community governance proposal
     * @param _proposal the address of the deployed proposal
     * @dev fee is only levied if community governance is paused - we want to still be usable 
     * in the event that ECO transfers are paused. 
     */
    function propose(Proposal _proposal) {
        updateStage();
        if (stage != Stage.Proposal) {
            revert WrongStage();
        }
        if (!paused) {
            ECO.transferFrom(msg.sender, this.address, proposalFee);
        }

        proposals[_proposal] = Proposal;
        Proposal.cycle = cycleCount;
        Proposal.proposer = msg.sender;

        emit ProposalRegistration(msg.sender, _proposal);
    }

    /** 
     * @notice allows an address to register its full voting power in support of a proposal
     * @param _proposal the address of proposal to be supported
     */
    function support(address _proposal) {
        updateStage();
        if (stage != Stage.Proposal) {
            revert WrongStage();
        }
    }

    /** 
     * @notice allows an address to register partial support for a set of proposals
     * @param _proposals the array of proposals to be supported
     * @param _amounts the respective voting power to put behind those proposals
     */
    function supportPartial(address[] _proposals, uint256[] _votingPowerAllocations) {
        updateStage();
        if (stage != Stage.Proposal) {
            revert WrongStage();
        }
        uint256 length = _proposals.length;
        if (length != _votingPowerAllocations.length) {
            revert ArrayLengthMismatch();
        }

        for(uint256 i = 0; i<length; i++) {
            proposals[_proposals[i]] = _votingPowerAllocations[i];
        }
    }
    
    /** 
     * @notice allows an address to revoke support for a proposal
     * @param _proposal the address of proposal to be supported
     */
    function unsupport(address _proposal) {
        if (stage != Stage.Proposal) {
            revert WrongStage();
        }

    }

    /** 
     * @notice allows an address to vote to enact, reject or abstain on a proposal
     * @param _proposal the address of proposal to be supported
     */
    function vote(Vote _vote) {
        updateStage();
        if (stage != Stage.Voting) {
            revert WrongStage();
        }

    }

    /** 
     * @notice allows an address to vote to enact, reject or abstain on a proposal
     * @param _proposal the address of proposal to be supported
     */
    function votePartial(Vote[] _votes, uint256[] _votingPowerAllocations) {
        updateStage();
        if (stage != Stage.Voting) {
            revert WrongStage();
        }
        if (_votes.length != _votingPowerAllocations.length) {
            revert ArrayLengthMismatch();
        }
    }

    function execute() {
        updateStage();
        if (stage != Stage.Execution) {
            revert WrongStage();
        }
        if (executed) {
            revert ExecutionAlreadyComplete();
        }
    }
}
