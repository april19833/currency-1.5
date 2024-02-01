// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./DummyL2Eco.sol";

/* solhint-disable */
contract DummyL2Bridge {
    DummyL2Eco public eco;

    constructor(DummyL2Eco _eco) {
        eco = _eco;
    }

    function withdrawTo(address _eco, address _l1Contract, uint256 _amount, uint32 _l1Gas, bytes memory _data) external {
        eco.transferFrom(msg.sender, address(this), _amount);
    }
}

