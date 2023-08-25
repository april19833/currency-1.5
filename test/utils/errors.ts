/**
 * @notice Contains all custom errors used in the contracts.
 * Should be exported in package
 */
export const ERRORS = {
  CurrencyGovernance: {
    TRUSTEE_ONLY: 'TrusteeOnlyFunction',
    REQUIRE_NON_ZERO_ADDRESS: 'NonZeroTrustedNodesAddr',
    WRONG_STAGE: 'WrongStage',
    // two args
    CYCLE_INCOMPLETE: 'CycleIncomplete',
  },
  Policed: {
    POLICY_ONLY: 'PolicyOnlyFunction',
    REQUIRE_NON_ZERO_ADDRESS: 'NonZeroPolicyAddr',
  },
  TrustedNodes: {
    CG_ONLY: 'GovernanceOnlyFunction',
    // one arg
    DUPLICATE_TRUST: 'NodeAlreadyTrusted',
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
}
