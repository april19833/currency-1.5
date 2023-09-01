/**
 * @notice Contains all custom errors used in the contracts.
 * Should be exported in package
 */
export const ERRORS = {
  CurrencyGovernance: {
    REQUIRE_NON_ZERO_ADDRESS: 'NonZeroTrustedNodesAddr',
    TRUSTEE_ONLY: 'TrusteeOnlyFunction',
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
  },
  Policed: {
    POLICY_ONLY: 'PolicyOnlyFunction',
    REQUIRE_NON_ZERO_ADDRESS: 'NonZeroPolicyAddr',
  },
  TrustedNodes: {
    CG_ONLY: 'GovernanceOnlyFunction',
    DUPLICATE_TRUST: 'NodeAlreadyTrusted', // one arg: the existing trustee number of the address
    DUPLICATE_DISTRUST: 'DistrustNotTrusted',
    EMPTY_WITHDRAW: 'WithdrawNoTokens',
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
}
