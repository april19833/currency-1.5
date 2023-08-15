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
    ALREADY_SUPPORTING: 'SupportAlreadyGiven',
    UNSUPPORT_WITH_NO_SUPPORT: 'SupportNotGiven',
    PROPOSALID_ALREADY_EXISTS: 'DuplicateProposal',
    UNSUPPORT_FROM_BAD_PROPOSAL: 'NoSuchProposal',
    SUPPORT_WHEN_ALREADY_SUPPORTING: 'DuplicateSupport',
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
}
