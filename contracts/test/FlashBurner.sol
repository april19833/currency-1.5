// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/community/CommunityGovernance.sol";
import "../currency/ECO.sol";
import "../currency/ECOx.sol";

contract FlashBurner {
    CommunityGovernance public immutable cg;
    ECO public immutable eco;
    ECOx public immutable ecox;

    constructor(CommunityGovernance _cg, ECO _eco, ECOx _ecox) {
        cg = _cg;
        eco = _eco;
        ecox = _ecox;
    }

    function exploit() public {
        cg.updateStage();
        eco.burn(address(this), eco.balanceOf(address(this)));
        ecox.burn(address(this), ecox.balanceOf(address(this)));
    }
}
