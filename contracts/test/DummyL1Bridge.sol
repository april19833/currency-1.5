// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./DummyL2Eco.sol";

/* solhint-disable */
contract DummyL1Bridge {
    DummyL2Eco public eco;

    constructor(DummyL2Eco _eco) {
        eco = _eco;
    }

    function depositERC20To(address _eco, address _l2Eco,address _l2Contract, uint256 _amount, uint32 _l2Gas, bytes memory _data) external {
        eco.transferFrom(msg.sender, address(this), _amount);
    }
}

