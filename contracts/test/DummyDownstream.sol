// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DummyDownstream {

    bool public success;

    function callThatSucceeds() public {
        success = true;
    }

    function callThatFails() public pure {
        require(false, "get rekt scrub");
    }

}