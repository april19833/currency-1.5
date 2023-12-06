// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../governance/community/proposals/Proposal.sol";
import "../governance/community/CommunityGovernance.sol";
import "../governance/monetary/CurrencyGovernance.sol";
import "../policy/Policy.sol";
import "../currency/ECO.sol";
import "../currency/ECOx.sol";

/** @title MinterProposal
 *
 * A proposal used for changing a minter
 */
contract MinterProposal is Policy, Proposal {
    ERC20MintAndBurn public immutable token;

    address public immutable minter;

    bool public immutable permission;

    constructor(
        ERC20MintAndBurn _token,
        address _minter,
        bool _permission
    ) Policy(address(0x0)) {
        token = _token;
        minter = _minter;
        permission = _permission;
    }

    function name() public pure override returns (string memory) {
        return "minting proposal";
    }

    function description() public pure override returns (string memory) {
        return "add or remove a minter";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        token.updateMinters(minter, permission);
    }
}

/** @title BurnerProposal
 *
 * A proposal used for changing a burner
 */
contract BurnerProposal is Policy, Proposal {
    ERC20MintAndBurn public immutable token;

    address public immutable burner;

    bool public immutable permission;

    constructor(
        ERC20MintAndBurn _token,
        address _burner,
        bool _permission
    ) Policy(address(0x0)) {
        token = _token;
        burner = _burner;
        permission = _permission;
    }

    function name() public pure override returns (string memory) {
        return "burner proposal";
    }

    function description() public pure override returns (string memory) {
        return "add or remove a burner";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        token.updateBurners(burner, permission);
    }
}

/** @title RebaserProposal
 *
 * A proposal used for changing a rebaser
 */
contract RebaserProposal is Policy, Proposal {
    ECO public immutable token;

    address public immutable rebaser;

    bool public immutable permission;

    constructor(
        ECO _token,
        address _rebaser,
        bool _permission
    ) Policy(address(0x0)) {
        token = _token;
        rebaser = _rebaser;
        permission = _permission;
    }

    function name() public pure override returns (string memory) {
        return "rebaser proposal";
    }

    function description() public pure override returns (string memory) {
        return "add or remove a rebaser";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        token.updateRebasers(rebaser, permission);
    }
}

/** @title SnapshotterProposal
 *
 * A proposal used for changing a snapshotter
 */
contract SnapshotterProposal is Policy, Proposal {
    ECO public immutable token;

    address public immutable snapshotter;

    bool public immutable permission;

    constructor(
        ECO _token,
        address _snapshotter,
        bool _permission
    ) Policy(address(0x0)) {
        token = _token;
        snapshotter = _snapshotter;
        permission = _permission;
    }

    function name() public pure override returns (string memory) {
        return "snapshotter proposal";
    }

    function description() public pure override returns (string memory) {
        return "add or remove a snapshotter";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        token.updateSnapshotters(snapshotter, permission);
    }
}

/** @title updateECOxExchangeProposal
 *
 * A proposal used for changing the ECOxExchange var
 */
contract UpdateECOxExchangeProposal is Policy, Proposal {
    ECOx public immutable token;

    address public immutable newECOxExchange;

    constructor(ECOx _token, address _newECOxExchange) Policy(address(0x0)) {
        token = _token;
        newECOxExchange = _newECOxExchange;
    }

    function name() public pure override returns (string memory) {
        return "updateECOxExchange proposal";
    }

    function description() public pure override returns (string memory) {
        return "change the ECOxExchange var";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        token.updateECOxExchange(newECOxExchange);
    }
}

/** @title token new pauser proposal
 *
 * A proposal used for changing the pauser on the tokens
 */
contract UpdateTokenPauserProposal is Policy, Proposal {
    ERC20Pausable public immutable token;

    address public immutable newPauser;

    constructor(ERC20Pausable _token, address _newPauser) Policy(address(0x0)) {
        token = _token;
        newPauser = _newPauser;
    }

    function name() public pure override returns (string memory) {
        return "token new pauser proposal";
    }

    function description() public pure override returns (string memory) {
        return "change the pauser for the tokens";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        token.setPauser(newPauser);
    }
}

/** @title governance new pauser proposal
 *
 * A proposal used for changing the pauser on the community governance contract
 */
contract UpdateGovernancePauserProposal is Policy, Proposal {
    CommunityGovernance public immutable governance;

    address public immutable newPauser;

    constructor(
        CommunityGovernance _governance,
        address _newPauser
    ) Policy(address(0x0)) {
        governance = _governance;
        newPauser = _newPauser;
    }

    function name() public pure override returns (string memory) {
        return "governance new pauser proposal";
    }

    function description() public pure override returns (string memory) {
        return "change the pauser for the governance";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        governance.setPauser(newPauser);
    }
}

/** @title governance fee sweep proposal
 *
 * A proposal used for sweeping the fees collected by the community governance contract to an address
 */
contract SweepGovernanceFeesProposal is Policy, Proposal {
    CommunityGovernance public immutable governance;

    address public immutable destination;

    constructor(
        CommunityGovernance _governance,
        address _destination
    ) Policy(address(0x0)) {
        governance = _governance;
        destination = _destination;
    }

    function name() public pure override returns (string memory) {
        return "governance fee sweep proposal";
    }

    function description() public pure override returns (string memory) {
        return "sweep the fees from governance to an address";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        governance.sweep(destination);
    }
}

/** @title governance new trustedNodes proposal
 *
 * A proposal used to change the trustedNodes contract for the currency governance
 */
contract UpdateGovernanceTrustedNodesProposal is Policy, Proposal {
    CurrencyGovernance public immutable governance;

    TrustedNodes public immutable newTrustedNodes;

    constructor(
        CurrencyGovernance _governance,
        TrustedNodes _newTrustedNodes
    ) Policy(address(0x0)) {
        governance = _governance;
        newTrustedNodes = _newTrustedNodes;
    }

    function name() public pure override returns (string memory) {
        return "governance new trustedNodes proposal";
    }

    function description() public pure override returns (string memory) {
        return "change the trustedNodes contract for the currency governance";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        governance.setTrustedNodes(newTrustedNodes);
    }
}

/** @title governance new enacter proposal
 *
 * A proposal used to change the enacter contract for the currency governance
 */
contract UpdateGovernanceEnacterProposal is Policy, Proposal {
    CurrencyGovernance public immutable governance;

    MonetaryPolicyAdapter public immutable newEnacter;

    constructor(
        CurrencyGovernance _governance,
        MonetaryPolicyAdapter _newEnacter
    ) Policy(address(0x0)) {
        governance = _governance;
        newEnacter = _newEnacter;
    }

    function name() public pure override returns (string memory) {
        return "governance new enacter proposal";
    }

    function description() public pure override returns (string memory) {
        return "change the enacter contract for the currency governance";
    }

    function url() public pure override returns (string memory) {
        return "n/a";
    }

    function enacted(address) public override {
        governance.setEnacter(newEnacter);
    }
}
