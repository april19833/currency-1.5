// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * contract to be a placeholder for a monetary policy lever in tests
 */
contract DummyLever {
    // var for tracking calls
    uint256 public executeMarker;

    // convenience data
    bytes4 public executeFunctionSignature = bytes4(keccak256("execute(uint256,address,bytes32)"));
    bytes4 public alwaysPassFunctionSignature = bytes4(keccak256("alwaysPass(bytes32)"));
    bytes4 public datalessPasserFunctionSignature = bytes4(keccak256("datalessPasser()"));
    bytes4 public alwaysRevertFunctionSignature = bytes4(keccak256("alwaysRevert(bytes32)"));

    // event for confirming data is passed correctly
    event ExecuteData(uint256 number, address account, bytes32 data);

    constructor() {}

    // functions to be called by monetary policy
    function execute(uint256 number, address account, bytes32 data) external {
        require(number < 1000, "revertcase");
        executeMarker += 2;
        emit ExecuteData(number, account, data);
    }

    function alwaysPass(bytes32 data) external {
        executeMarker += 3;
    }

    function datalessPasser() external {
        executeMarker += 5;
    }

    function alwaysRevert(bytes32 data) external {
        executeMarker += 7;
        revert("I'm the reverter");
    }

    fallback(bytes calldata data) external payable returns (bytes memory) {
        executeMarker += 11;
        return data;
    }
}

