import { ethers } from 'hardhat'
import { constants, BigNumber } from 'ethers'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { DAY } from '../../utils/constants'
import { ERRORS } from '../../utils/errors'
import {
  TrustedNodes__factory,
  TrustedNodes,
  CurrencyGovernance__factory,
  CurrencyGovernance,
  StageTestCurrencyGovernance__factory,
  StageTestCurrencyGovernance,
  Policy,
} from '../../../typechain-types'

const PROPOSE_STAGE_LENGTH = 10 * DAY
const COMMIT_STAGE_LENGTH = 3 * DAY
const REVEAL_STAGE_LENGTH = 1 * DAY
const REVEAL_STAGE_START = PROPOSE_STAGE_LENGTH + COMMIT_STAGE_LENGTH
const CYCLE_LENGTH =
  PROPOSE_STAGE_LENGTH + COMMIT_STAGE_LENGTH + REVEAL_STAGE_LENGTH
// enum values
const PROPOSE_STAGE = 0
const COMMIT_STAGE = 1
const REVEAL_STAGE = 2

describe('CurrencyGovernance', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress
  let dave: SignerWithAddress
  let niko: SignerWithAddress
  let mila: SignerWithAddress
  let policyImpersonater: SignerWithAddress
  before(async () => {
    ;[policyImpersonater, alice, bob, charlie, dave, niko, mila] =
      await ethers.getSigners()
  })

  let TrustedNodes: MockContract<TrustedNodes>
  let CurrencyGovernance: MockContract<CurrencyGovernance>
  let Fake__Policy: FakeContract<Policy>
  beforeEach(async () => {
    // Get a new mock L1 messenger
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonater.getAddress() } // This allows us to make calls from the address
    )

    TrustedNodes = await (
      await smock.mock<TrustedNodes__factory>('TrustedNodes')
    ).deploy(
      Fake__Policy.address,
      [bob.address, charlie.address, dave.address],
      0
    )

    CurrencyGovernance = await (
      await smock.mock<CurrencyGovernance__factory>('CurrencyGovernance')
    ).deploy(Fake__Policy.address, TrustedNodes.address, alice.address)
  })

  describe('trustee role', async () => {
    it('trustees can call onlyTrusted functions', async () => {
      await CurrencyGovernance.connect(bob).propose(0, 1, 1, 1, 1, 1, '')
    })

    it('non-trustees cannot call onlyTrusted functions', async () => {
      await expect(
        CurrencyGovernance.connect(alice).propose(0, 1, 1, 1, 1, 1, '')
      ).to.be.revertedWith(ERRORS.CurrencyGovernance.TRUSTEE_ONLY)
    })
  })

  describe('trusted nodes role', async () => {
    it('can be changed by the policy', async () => {
      const initialTNAddress = await CurrencyGovernance.trustedNodes()
      await CurrencyGovernance.connect(policyImpersonater).setTrustedNodes(
        alice.address
      )
      const changedTNAddress = await CurrencyGovernance.trustedNodes()
      expect(changedTNAddress !== initialTNAddress).to.be.true
      expect(changedTNAddress === alice.address).to.be.true
    })

    it('is onlyPolicy gated', async () => {
      await expect(
        CurrencyGovernance.connect(alice).setTrustedNodes(alice.address)
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    })

    it('cannot be set to the zero address', async () => {
      await expect(
        CurrencyGovernance.connect(policyImpersonater).setTrustedNodes(
          constants.AddressZero
        )
      ).to.be.revertedWith(ERRORS.CurrencyGovernance.REQUIRE_NON_ZERO_ADDRESS)
    })
  })

  describe('time calculations', () => {
    const initialCycle = 0
    let StageTestCG: MockContract<StageTestCurrencyGovernance>

    beforeEach(async () => {
      StageTestCG = await (
        await smock.mock<StageTestCurrencyGovernance__factory>(
          'StageTestCurrencyGovernance'
        )
      ).deploy()
    })

    async function checkStageModifiers(cycle: Number, stage: Number) {
      if (stage === PROPOSE_STAGE) {
        expect(await StageTestCG.inProposePhase(cycle)).to.be.true
        await expect(StageTestCG.inVotePhase(cycle)).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
        await expect(StageTestCG.inRevealPhase(cycle)).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
      } else if (stage === COMMIT_STAGE) {
        await expect(StageTestCG.inProposePhase(cycle)).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
        expect(await StageTestCG.inVotePhase(cycle)).to.be.true
        await expect(StageTestCG.inRevealPhase(cycle)).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
      } else if (stage === REVEAL_STAGE) {
        await expect(StageTestCG.inProposePhase(cycle)).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
        await expect(StageTestCG.inVotePhase(cycle)).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
        expect(await StageTestCG.inRevealPhase(cycle)).to.be.true
      } else {
        throw Error('checkModifiers: bad stage input')
      }
    }

    describe('propose stage', () => {
      it('starts in propose stage', async () => {
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(initialCycle, PROPOSE_STAGE)
      })

      it('check middle of propose stage', async () => {
        await time.increase((PROPOSE_STAGE_LENGTH * 2) / 10)
        const stageInfo1 = await StageTestCG.getCurrentStage()
        expect(stageInfo1.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo1.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(initialCycle, PROPOSE_STAGE)

        await time.increase((PROPOSE_STAGE_LENGTH * 5) / 10)
        const stageInfo2 = await StageTestCG.getCurrentStage()
        expect(stageInfo2.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo2.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(initialCycle, PROPOSE_STAGE)
      })

      it('test near end of propose stage', async () => {
        await time.increase(PROPOSE_STAGE_LENGTH - 1000)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(initialCycle, PROPOSE_STAGE)
      })

      it('test end of propose stage', async () => {
        await time.increase(PROPOSE_STAGE_LENGTH - 1)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(initialCycle, PROPOSE_STAGE)
      })
    })

    describe('commit stage', () => {
      beforeEach(async () => {
        await time.increase(PROPOSE_STAGE_LENGTH)
      })

      it('enters in commit stage', async () => {
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(COMMIT_STAGE)
        await checkStageModifiers(initialCycle, COMMIT_STAGE)
      })

      it('test middle of commit stage', async () => {
        await time.increase((COMMIT_STAGE_LENGTH * 3) / 5)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(COMMIT_STAGE)
        await checkStageModifiers(initialCycle, COMMIT_STAGE)
      })

      it('test near end of commit stage', async () => {
        await time.increase(COMMIT_STAGE_LENGTH - 1000)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(COMMIT_STAGE)
        await checkStageModifiers(initialCycle, COMMIT_STAGE)
      })

      it('test end of commit stage', async () => {
        await time.increase(COMMIT_STAGE_LENGTH - 1)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(COMMIT_STAGE)
        await checkStageModifiers(initialCycle, COMMIT_STAGE)
      })
    })

    describe('reveal stage', () => {
      beforeEach(async () => {
        await time.increase(REVEAL_STAGE_START)
      })

      it('enters in reveal stage', async () => {
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(REVEAL_STAGE)
        await checkStageModifiers(initialCycle, REVEAL_STAGE)
      })

      it('test middle of reveal stage', async () => {
        await time.increase((REVEAL_STAGE_LENGTH * 1) / 5)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(REVEAL_STAGE)
        await checkStageModifiers(initialCycle, REVEAL_STAGE)
      })

      it('test near end of reveal stage', async () => {
        await time.increase(REVEAL_STAGE_LENGTH - 1000)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(REVEAL_STAGE)
        await checkStageModifiers(initialCycle, REVEAL_STAGE)
      })

      it('test end of reveal stage', async () => {
        await time.increase(REVEAL_STAGE_LENGTH - 1)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(REVEAL_STAGE)
        await checkStageModifiers(initialCycle, REVEAL_STAGE)
      })
    })

    describe('cycle tests', () => {
      const completedCycles = 20
      beforeEach(async () => {
        await time.increase(CYCLE_LENGTH * completedCycles)
      })

      it('test end of cycle', async () => {
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(completedCycles)).to.be.true
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(completedCycles, PROPOSE_STAGE)
      })

      it('test forward incompleteness', async () => {
        await expect(
          StageTestCG.cycleCompleted(completedCycles)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INCOMPLETE)
        await expect(
          StageTestCG.cycleCompleted(completedCycles + 1)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INCOMPLETE)
        await expect(
          StageTestCG.cycleCompleted(completedCycles + 2)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INCOMPLETE)
        await expect(
          StageTestCG.cycleCompleted(completedCycles + 10)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INCOMPLETE)
        await expect(
          StageTestCG.cycleCompleted(completedCycles + 1000)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INCOMPLETE)
      })

      it('test past completeness', async () => {
        expect(await StageTestCG.cycleCompleted(completedCycles - 1)).to.be.true
        expect(await StageTestCG.cycleCompleted(completedCycles - 2)).to.be.true
        expect(await StageTestCG.cycleCompleted(completedCycles - 10)).to.be
          .true
        expect(await StageTestCG.cycleCompleted(0)).to.be.true
      })

      describe('test stage modifiers in wrong cycle', () => {
        it('propose phase', async () => {
          await expect(
            StageTestCG.inProposePhase(completedCycles - 1)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INACTIVE)
          expect(await StageTestCG.inProposePhase(completedCycles)).to.be.true
          await expect(
            StageTestCG.inProposePhase(completedCycles + 1)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INACTIVE)
        })

        it('commit phase', async () => {
          await time.increase(PROPOSE_STAGE_LENGTH)
          await expect(
            StageTestCG.inVotePhase(completedCycles - 1)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INACTIVE)
          expect(await StageTestCG.inVotePhase(completedCycles)).to.be.true
          await expect(
            StageTestCG.inVotePhase(completedCycles + 1)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INACTIVE)
        })

        it('reveal phase', async () => {
          await time.increase(REVEAL_STAGE_START)
          await expect(
            StageTestCG.inRevealPhase(completedCycles - 1)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INACTIVE)
          expect(await StageTestCG.inRevealPhase(completedCycles)).to.be.true
          await expect(
            StageTestCG.inRevealPhase(completedCycles + 1)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INACTIVE)
        })
      })
    })
  })
})
