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
        CYCLE_INACTIVE: 'CycleInactive',
        // two args
        CYCLE_INCOMPLETE: 'CycleIncomplete',
    },
    Policed: {
        POLICY_ONLY: 'PolicyOnlyFunction',
    },
  }
  