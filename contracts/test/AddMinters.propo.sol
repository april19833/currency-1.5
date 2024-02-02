// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../policy/Policy.sol";
import "../policy/Policed.sol";
import "../governance/community/proposals/Proposal.sol";
import "../currency/ECO.sol";
import "../currency/ECOx.sol";

/** @title AddMinters
 * A proposal to add some minters
 * strictly a test, please dont actually do this
 */
contract AddMinters is Policy, Proposal {
    address[] public newMinters;

    uint256 public immutable mintersLength;

    ECO public immutable eco;

    ECOx public immutable ecox;

    string public name;

    string public description;

    string public url;

    constructor(
        address[] memory _newMinters,
        ECO _eco,
        ECOx _ecox,
        string memory _name,
        string memory _description,
        string memory _url
    ) Policy(address(0x0)) {
        newMinters = _newMinters;
        mintersLength = _newMinters.length;
        eco = _eco;
        ecox = _ecox;
        name = _name;
        description = _description;
        url = _url;
    }

    function enacted(address self) public override {
        for (uint256 i = 0; i < mintersLength; i++) {
            address minter = AddMinters(self).newMinters(i);
            eco.updateMinters(minter, true);
            ecox.updateMinters(minter, true);
        } 
    }
}
