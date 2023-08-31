// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DummyDownstream {
    bool public notified;

    bool public pigsFly;

    function callThatSucceeds() public {
        notified = true;
    }

    function callThatFails() public {
        require(false, "get rekt scrub");
        pigsFly = true;
    }
}
