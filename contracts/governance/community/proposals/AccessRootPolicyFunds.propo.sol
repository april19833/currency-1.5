// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../policy/Policy.sol";
import "../../../policy/Policed.sol";
import "./Proposal.sol";
import "../../../currency/ECO.sol";
import "../../../currency/ECOx.sol";

/** @title DeployRootPolicyFundw
 * A proposal to send some root policy funds to another
 * address (multisig, lockup, etc)
 */
contract AccessRootPolicyFunds is Policy, Proposal {
    address public immutable recipient;

    ECO public immutable eco;

    ECOx public immutable ecox;

    uint256 public immutable ecoAmount;

    uint256 public immutable ecoXAmount;

    string public name;

    string public description;

    string public url;

    constructor(
        address _recipient,
        ECO _eco,
        ECOx _ecox,
        uint256 _ecoAmount,
        uint256 _ecoXAmount,
        string memory _name,
        string memory _description,
        string memory _url
    ) Policy(address(0x0)) {
        recipient = _recipient;
        eco = _eco;
        ecox = _ecox;
        ecoAmount = _ecoAmount;
        ecoXAmount = _ecoXAmount;
        name = _name;
        description = _description;
        url = _url;
    }

    function enacted(address) public override {
        eco.transfer(recipient, ecoAmount);
        ecox.transfer(recipient, ecoXAmount);
    }
}
