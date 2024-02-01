// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.13;

/* solhint-disable */

contract DummyMessenger {
    address public xDomainMsgSender;

    constructor(address _xDomainMsgSender) {
        xDomainMsgSender = _xDomainMsgSender;
    }

    function xDomainMessageSender() external view returns (address) {
        return xDomainMsgSender;
    }

    function changeSender(address _sender) public {
        xDomainMsgSender = _sender;
    }
}