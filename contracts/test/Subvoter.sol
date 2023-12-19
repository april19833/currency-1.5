// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../currency/ECO.sol";
import "../governance/community/CommunityGovernance.sol";
import "../governance/community/proposals/Proposal.sol";

contract Subvoter {
    ECO public immutable ecoaddress;

    CommunityGovernance public immutable communityGovernance;

    constructor(ECO _ecoaddress, CommunityGovernance _communityGovernance) {
        ecoaddress = _ecoaddress;
        communityGovernance = _communityGovernance;
        ecoaddress.enableVoting();
    }

    function support(address _proposalToSupport)
        public
    {
        communityGovernance.support(_proposalToSupport);
        ecoaddress.transfer(msg.sender, ecoaddress.balanceOf(address(this)));
    }

    function vote() public {
        communityGovernance.vote(CommunityGovernance.Vote.Enact);
        ecoaddress.transfer(msg.sender, ecoaddress.balanceOf(address(this)));
    }
}
