/**
 * @notice Contains all custom errors used in the contracts.
 * Should be exported in package
 */
export const ERRORS = {
  CurrencyGovernance: {
    REQUIRE_NON_ZERO_TRUSTEDNODES: 'NonZeroTrustedNodesAddr',
    BAD_QUORUM: 'BadQuorum',
    TRUSTEE_ONLY: 'TrusteeOnlyFunction',
    REQUIRE_NON_ZERO_ENACTER: 'NonZeroEnacterAddr',
    WRONG_STAGE: 'WrongStage',
    CYCLE_INCOMPLETE: 'CycleIncomplete', // two args: requested cycle and actual cycle
    DESCRIPTION_TOO_LONG: 'ExceedsMaxDescriptionSize', // one arg: the submitted length
    TARGETS_TOO_LONG_OR_ZERO: 'BadNumTargets', // one arg: the length of the submitted array
    ARRAYS_BAD_LENGTH: 'ProposalActionsArrayMismatch',
    ALREADY_SUPPORTED: 'SupportAlreadyGiven',
    UNSUPPORT_WITH_NO_SUPPORT: 'SupportNotGiven',
    PROPOSALID_ALREADY_EXISTS: 'DuplicateProposal',
    PROPOSALID_INVALID: 'NoSuchProposal',
    SUPPORT_WHEN_ALREADY_SUPPORTING: 'DuplicateSupport',
    EMPTY_VOTES_ARRAY: 'CannotVoteEmpty',
    COMMIT_REVEAL_MISMATCH: 'CommitMismatch',
    BAD_PROPOSALID_IN_VOTE: 'InvalidVoteBadProposalId', // one arg: the vote with the invalid proposalId
    PROPOSALID_MISORDERED: 'InvalidVoteBadProposalOrder', // two args: the vote before the reverting vote and the vote with out of order proposalId
    BAD_SCORE: 'InvalidVoteBadScore', // one arg: the vote with the score that duplicates or overlaps poorly with the support of another score, including underflow
    FINAL_SCORES_INVALID: 'InvalidVotesOutOfBounds',
    QUORUM_NOT_MET: 'QuorumNotMet',
    OUTDATED_ENACT: 'EnactCycleNotCurrent',
    BAD_ABSTAIN: 'NoAbstainWithCommit',
  },
  MonetaryPolicyAdapter: {
    CURRENCYGOVERNANCE_ONLY: 'CurrencyGovernanceOnlyFunction',
    REQUIRE_NON_ZERO_CURRENCYGOVERNANCE: 'NonZeroCurrencyGovernanceAddr',
    BAD_MONETARY_POLICY: 'FailedPolicy',
  },
  Policed: {
    POLICY_ONLY: 'PolicyOnlyFunction',
    REQUIRE_NON_ZERO_ADDRESS: 'NonZeroPolicyAddr',
    NON_ZERO_CONTRACT_ADDRESS: 'NonZeroContractAddr',
  },
  Policy: {
    ENACTION_UNSPECIFIED_REVERT: 'FailedProposal',
    GOVERNOR_ONLY: 'OnlyGovernor',
  },
  TrustedNodes: {
    CG_ONLY: 'GovernanceOnlyFunction',
    DUPLICATE_TRUST: 'NodeAlreadyTrusted', // one arg: the existing trustee number of the address
    DUPLICATE_DISTRUST: 'DistrustNotTrusted',
    EMPTY_WITHDRAW: 'WithdrawNoTokens',
    INACTIVE_TERM: 'InactiveTerm',
  },
  Lever: {
    AUTHORIZED_ONLY: 'AuthorizedOnly',
  },
  Notifier: {
    NON_LEVER_CALL: 'NonLeverCall',
    TRANSACTION_DATA_LENGTH_MISMATCH: 'TransactionDataLengthMismatch',
    NO_TRANSACTION_AT_INDEX: 'NoTransactionAtIndex',
  },
  Rebase: {
    BAD_INFLATION_MULTIPLIER: 'BadInflationMultiplier',
  },
  Lockups: {
    EARLY_WITHDRAW_FOR: 'EarlyWithdrawFor',
    LATE_DEPOSIT: 'LateDeposit',
    BAD_RATE: 'BadRate',
    BAD_DURATION: 'BadDuration',
  },
  ERC20ROLES: {
    ONLY_MINTERS: 'OnlyMinters',
    ONLY_BURNERS: 'OnlyBurners',
  },
  ECO: {
    BAD_MINTER: 'OnlyMinters',
    BAD_BURNER: 'OnlyBurners',
    BAD_REBASER: 'OnlyRebasers',
    BAD_SNAPSHOTTER: 'OnlySnapshotters',
    REBASE_TO_ZERO: 'BadRebaseValue',
  },
  ERC20: {
    BURN_BAD_AMOUNT: 'ERC20: burn amount exceeds balance',
    BAD_MINT_TARGET: 'ERC20: mint to the zero address',
    TRANSFER_BAD_AMOUNT: 'ERC20: transfer amount exceeds balance',
    TRANSFER_NO_ZERO_ADDRESS: 'ERC20: transfer to the zero address',
    TRANSFERFROM_BAD_ALLOWANCE: 'ERC20: transfer amount exceeds allowance',
    APPROVE_NO_ZERO_ADDRESS: 'ERC20: approve to the zero address',
    DECREASEALLOWANCE_UNDERFLOW: 'ERC20: decreased allowance below zero',
  },
  ERC20PAUSABLE: {
    ONLY_ROLE_ADMIN: 'ERC20Pausable: not admin',
    ONLY_PAUSER: 'ERC20Pausable: not pauser',
  },
  PAUSABLE: {
    REQUIRE_NOT_PAUSED: 'Pausable: paused',
    REQUIRE_PAUSED: 'Pausable: not paused',
  },
  ECOxStaking: {
    CONSTRUCTOR_ZERO_ECOX_ADDRESS: 'NoZeroECOx',
    ATTEMPTED_TRANSFER: 'NonTransferrable',
  },
  FailureProposal: {
    PROPOSAL_FAILURE_ERROR: 'ImSorry',
    PROPOSAL_FAILURE_STRING: "I'm an annoying error string!",
    PANIC:
      'VM Exception while processing transaction: reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)',
  },
  COMMUNITYGOVERNANCE: {
    ONLY_PAUSER: 'OnlyPauser',
    WRONG_STAGE: 'WrongStage',
    BAD_CYCLE_START: 'BadCycleStart',
    DUPLICATE_PROPOSAL: 'DuplicateProposal',
    OLD_PROPOSAL_SUPPORT: 'OldProposalSupport',
    ARRAY_LENGTH_MISMATCH: 'ArrayLengthMismatch',
    BAD_VOTING_POWER: 'BadVotingPower',
    BAD_SUPPORT_THRESHOLD_PERCENT: 'BadSupportThresholdPercent',
    NO_SUPPORT_TO_REVOKE: 'NoSupportToRevoke',
    BAD_VOTE_TYPE: 'BadVoteType',
    NO_REFUND_AVAILABLE: 'NoRefundAvailable',
    NO_REFUND_DURING_CYCLE: 'NoRefundDuringCycle',
  },
}
