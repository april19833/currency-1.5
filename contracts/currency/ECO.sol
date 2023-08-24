/* -*- c-basic-offset: 4 -*- */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./InflationCheckpoints.sol";
import "../governance/monetary/CurrencyGovernance.sol";

/** @title An ERC20 token interface to the Eco currency system.
 */
contract ECO is InflationCheckpoints {
    bool public rebased;

    /** Fired when a proposal with a new inflation multiplier is selected and passed.
     * Used to calculate new values for the rebased token.
     */
    event NewInflationMultiplier(uint256 inflationMultiplier);

    address public rebaser;

    /* Current generation of the balance store. */
    uint256 public currentGeneration;

    // the address of the contract for initial distribution
    address public immutable distributor;

    uint256 public immutable initialSupply;

    constructor(
        Policy _policy,
        address _distributor,
        uint256 _initialSupply,
        address _initialPauser
    ) InflationCheckpoints(_policy, "ECO", "ECO", _initialPauser) {
        distributor = _distributor;
        initialSupply = _initialSupply;
    }

    function initialize(
        address _self
    ) public virtual override onlyConstruction {
        super.initialize(_self);
        pauser = ERC20Pausable(_self).pauser();
        _mint(distributor, initialSupply);
    }

    function mint(address _to, uint256 _value) external {
        _mint(_to, _value);
    }

    function burn(address _from, uint256 _value) external {
        require(msg.sender == _from, "Caller not authorized to burn tokens");

        _burn(_from, _value);
    }

    function rebase(uint256 _inflationMultiplier) public {
        rebased = true;
    }
}
