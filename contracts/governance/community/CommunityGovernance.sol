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

    /** @notice ECOxStaking contract */
    ECOxStaking public immutable ecoXStaking;

    /** @notice address allowed to pause community governance */
    address public pauser;

    /** @notice reference any proposal by its address*/
    mapping(address => PropData) proposals;

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

    /** @notice the proposal being voted on this cycle */
    address public selectedProposal;

    // /** @notice mapping of an address to its votes to enact the selected proposal */
    // mapping(address => uint256) votesEnact;

    // /** @notice mapping of an address to its votes to reject the selected proposal */
    // mapping(address => uint256) votesReject;

    // /** @notice mapping of an address to its votes to abstain from voting on the selected proposal */
    // mapping(address => uint256) votesAbstain;

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

    /** @notice thrown when address attempts to support the same proposal twice */
    error NoDoubleSupport();

    /** @notice thrown when execute is called and the proposal has already been executed */
    error ExecutionAlreadyComplete();

    /** @notice thrown when related argument arrays have differing lengths */
    error ArrayLengthMismatch();

    /** @notice thrown when a call is made during the wrong stage of Community Governance */
    error WrongStage();

    /** @notice thrown when the total voting power of a support action is too high */
    error BadVotingPowerSum();

    /** @notice thrown when unsupport is called without the caller having supported the proposal */
    error NoSupportToRevoke();

    /** @notice thrown when vote is called with a vote type other than enact, reject, abstain */
    error BadVoteType();

    //////////////////////////////////////////////
    /////////////////// EVENTS ///////////////////
    //////////////////////////////////////////////

    /**
     * @notice An event indicating a proposal has been registered
     * @param proposer The address that submitted the proposal
     * @param proposal The address of the proposal contract instance that was added
     */
    event ProposalRegistration(
        address indexed proposer,
        Proposal indexed proposal
    );

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
     * @param _ecoXStaking the ECOxStaking contract address
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

        cycleStart = getTime() - CYCLE_LENGTH;
        cycleCount = 1000;
        nextCycle();
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
    function pause() external onlyPauser {
        _pause();
    }

    /**
     * @notice updates the current stage
     * @dev called by methods propose, vote, and execute.
     */
    function updateStage() public {
        uint256 time = getTime();
        if (time > currentStageEnd) {
            if (stage == Stage.Proposal) {
                // no proposal was selected
                stage = Stage.Done;
                currentStageEnd = cycleStart + CYCLE_LENGTH;
            } else if (stage == Stage.Voting) {
                if (
                    totalEnactVotes > totalRejectVotes &&
                    totalEnactVotes > totalAbstainVotes
                ) {
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
                currentStageEnd = cycleStart + CYCLE_LENGTH;
            } else {
                nextCycle();
            }
        }
    }

    /** @notice moves community governance to the next cycle */
    function nextCycle() internal {
        if (stage != Stage.Done) {
            revert WrongStage();
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
        snapshotBlock = block.number;
        cycleTotalVotingPower = totalVotingPower();
        delete selectedProposal;
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
        if (!paused()) {
            ecoToken.transferFrom(msg.sender, address(this), proposalFee);
        }

        PropData storage prop = proposals[address(_proposal)];
        prop.cycle = cycleCount;
        prop.proposer = msg.sender;

        emit ProposalRegistration(msg.sender, _proposal);
    }

    /**
     * @notice allows an address to register its full voting power in support of a proposal
     * @param _proposal the address of proposal to be supported
     */
    function support(address _proposal) public {
        updateStage();
        if (stage != Stage.Proposal) {
            revert WrongStage();
        }
        // PropData storage prop = proposals[_proposal];
        uint256 vp = votingPower(msg.sender, snapshotBlock);

        _changeSupport(msg.sender, _proposal, vp);

        // if (prop.support(msg.sender) == 0) {
        //     prop.support[msg.sender] = vp;
        //     prop.totalSupport += vp;

        //     if (prop.totalSupport > cycleTotalVotingPower * supportThresholdPercent / 100) {
        //         selectedProposal = _proposal;
        //         stage = Stage.Voting;
        //         currentStageEnd = getTime() + VOTING_LENGTH;
        //     }
        // } else {
        //     revert NoDoubleSupport();
        // }
    }

    /**
     * @notice allows an address to register partial support for a set of proposals
     * @param _proposals the array of proposals to be supported
     * @param _allocations the respective voting power to put behind those proposals
     */
    function supportPartial(
        address[] memory _proposals,
        uint256[] memory _allocations
    ) public {
        updateStage();
        if (stage != Stage.Proposal) {
            revert WrongStage();
        }
        uint256 length = _proposals.length;
        if (length != _allocations.length) {
            revert ArrayLengthMismatch();
        }

        uint256 sumSupport = 0;
        for (uint256 i = 0; i < length; i++) {
            uint256 support = _allocations[i];
            sumSupport += support;
            _changeSupport(msg.sender, _proposals[i], support);
        }
        // for (uint256 i = 0; i < length; i++) {
        //     address propAddress = _proposals[i];
        //     uint256 vp = _allocations[i];
        //     PropData storage prop = proposals[propAddress];
        //     uint256 currentSupport = prop.support(msg.sender);

        //     if (currentSupport > 0) {
        //         prop.totalSupport -= currentSupport;
        //         prop.support[msg.sender] = 0;
        //     }
        //     prop.support[msg.sender] = vp;
        //     prop.totalSupport += vp;
        //     sumSupport += vp;

        //     if (prop.totalSupport > cycleTotalVotingPower * supportThresholdPercent / 100) {
        //         selectedProposal = propAddress;
        //         stage = Stage.Voting;
        //         currentStageEnd = getTime() + VOTING_LENGTH;
        //     }
        // }
        if (sumSupport > votingPower(msg.sender, snapshotBlock)) {
            revert BadVotingPowerSum();
        }
    }

    /**
     * @notice allows an address to revoke support for a proposal
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
        PropData storage prop = proposals[proposal];
        uint256 vp = votingPower(supporter, snapshotBlock);

        uint256 support = prop.support[supporter];
        uint256 totalSupport = prop.totalSupport;

        emit SupportChanged(supporter, Proposal(proposal), support, amount);

        totalSupport -= support;
        support = amount;
        totalSupport += support;

        if (
            prop.totalSupport >
            (cycleTotalVotingPower * supportThresholdPercent) / 100
        ) {
            selectedProposal = proposal;
            stage = Stage.Voting;
            currentStageEnd = getTime() + VOTING_LENGTH;
        }
    }

    /**
     * @notice allows an address to vote to enact, reject or abstain on a proposal
     * @param choice the address' vote
     */
    function vote(Vote choice) public {
        updateStage();
        if (stage != Stage.Voting) {
            revert WrongStage();
        }

        _vote(msg.sender, choice, votingPower(msg.sender, snapshotBlock));
    }

    /**
     * @notice allows an address to split their voting power allocation between enact, reject and abstain
     * @param _votes the array of votes
     * @param _votes the array of voting power allocations
     */
    function votePartial(
        Vote[] memory _votes,
        uint256[] memory _allocations
    ) public {
        updateStage();
        if (stage != Stage.Voting) {
            revert WrongStage();
        }
        if (_votes.length != 3 || _allocations.length != 3) {
            revert ArrayLengthMismatch();
        }
        if (
            _allocations[1] + _allocations[2] + _allocations[3] >
            votingPower(msg.sender, snapshotBlock)
        ) {
            revert BadVotingPowerSum();
        }
        for (uint256 i = 0; i < 3; i++) {
            _vote(msg.sender, _votes[i], _allocations[i]);
        }
    }

    function _vote(address voter, Vote choice, uint256 amount) internal {
        if (uint(choice) > 2) {
            // enums are assigned uint values
            revert BadVoteType();
        }

        PropData storage prop = proposals[selectedProposal];

        uint256 enactVotes = prop.enactVotes[voter];
        uint256 rejectVotes = prop.rejectVotes[voter];
        uint256 abstainVotes = prop.abstainVotes[voter];

        totalEnactVotes -= enactVotes;
        delete enactVotes;
        totalRejectVotes -= rejectVotes;
        delete rejectVotes;
        totalAbstainVotes -= abstainVotes;
        delete abstainVotes;

        if (choice == Vote.Enact) {
            enactVotes = amount;
            totalEnactVotes += amount;
        } else if (choice == Vote.Reject) {
            rejectVotes = amount;
            totalRejectVotes += amount;
        } else {
            abstainVotes = amount;
            totalAbstainVotes += amount;
        }

        if (
            (totalEnactVotes) >
            (cycleTotalVotingPower * voteThresholdPercent) / 100
        ) {
            stage = Stage.Execution;
            currentStageEnd = getTime() + VOTING_LENGTH;
        }
    }

    function execute() public {
        updateStage();
        if (stage != Stage.Execution) {
            revert WrongStage();
        }
        if (executed) {
            revert ExecutionAlreadyComplete();
        }
        //Enact the policy
        // policy.internalCommand(
        //     address(selectedProposal),
        //     0x65474dbc3934a157baaaa893dea8c73453f0cc9c47a4f857047e8f0c8b54888f
        // );
        executed = true;
    }
}
