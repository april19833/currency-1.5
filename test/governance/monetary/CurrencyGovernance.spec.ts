import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { expect } from 'chai'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
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
const initialCycle = 1000

const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'
const PLACEHOLDER_ADDRESS2 = '0x2222222222222222222222222222222222222222'

// just some valid info to submit with
const targets = [PLACEHOLDER_ADDRESS1, PLACEHOLDER_ADDRESS2]
const functions = ['0x1234abcd', '0xabcd1234']
const calldatas = ['0x', '0x1234567890abcdef']
const description = 'here\'s a description for the proposal'

const getProposalId = (cycle: number, targets: string[], functions: string[], calldatas: string[]) => {
  const packing = ethers.utils.defaultAbiCoder.encode(['address[]', 'bytes4[]', 'bytes[]'], [targets, functions, calldatas])
  const intermediateHash = ethers.utils.keccak256(packing)
  return ethers.utils.solidityKeccak256(['uint256', 'bytes32'], [cycle, intermediateHash])
}

describe.only('CurrencyGovernance', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress
  let dave: SignerWithAddress
  // let niko: SignerWithAddress
  // let mila: SignerWithAddress
  let policyImpersonater: SignerWithAddress
  before(async () => {
    ;[policyImpersonater, alice, bob, charlie, dave] = await ethers.getSigners()
  })

  let TrustedNodes: MockContract<TrustedNodes>
  let CurrencyGovernance: CurrencyGovernance
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
      PLACEHOLDER_ADDRESS1,
      PLACEHOLDER_ADDRESS2,
      1000 * DAY,
      1,
      [bob.address, charlie.address, dave.address]
    )

    CurrencyGovernance = await new CurrencyGovernance__factory()
      .connect(policyImpersonater)
      .deploy(Fake__Policy.address, TrustedNodes.address)

    await TrustedNodes.connect(policyImpersonater).updateCurrencyGovernance(
      CurrencyGovernance.address
    )
  })

  describe('trustee role', () => {
    it('trustees can call onlyTrusted functions', async () => {
      await CurrencyGovernance.connect(bob).propose(targets, functions, calldatas, description)
    })

    it('non-trustees cannot call onlyTrusted functions', async () => {
      await expect(
        CurrencyGovernance.connect(alice).propose(targets, functions, calldatas, description)
      ).to.be.revertedWith(ERRORS.CurrencyGovernance.TRUSTEE_ONLY)
    })
  })

  describe('trusted nodes role', () => {
    it('can be changed by the policy', async () => {
      const initialTNAddress = await CurrencyGovernance.trustedNodes()
      await CurrencyGovernance.connect(policyImpersonater).setTrustedNodes(
        alice.address
      )
      const changedTNAddress = await CurrencyGovernance.trustedNodes()
      expect(changedTNAddress !== initialTNAddress).to.be.true
      expect(changedTNAddress === alice.address).to.be.true
    })

    it('emits an event', async () => {
      expect(await CurrencyGovernance.connect(policyImpersonater).setTrustedNodes(
        alice.address
      )).to.emit(CurrencyGovernance, 'NewTrustedNodes').withArgs(TrustedNodes.address, alice.address)
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
    let StageTestCG: StageTestCurrencyGovernance

    beforeEach(async () => {
      StageTestCG = await new StageTestCurrencyGovernance__factory()
        .connect(policyImpersonater)
        .deploy()
    })

    async function checkStageModifiers(stage: Number) {
      if (stage === PROPOSE_STAGE) {
        expect(await StageTestCG.inProposePhase()).to.be.true
        await expect(StageTestCG.inVotePhase()).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
        await expect(StageTestCG.inRevealPhase()).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
      } else if (stage === COMMIT_STAGE) {
        await expect(StageTestCG.inProposePhase()).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
        expect(await StageTestCG.inVotePhase()).to.be.true
        await expect(StageTestCG.inRevealPhase()).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
      } else if (stage === REVEAL_STAGE) {
        await expect(StageTestCG.inProposePhase()).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
        await expect(StageTestCG.inVotePhase()).to.be.revertedWith(
          ERRORS.CurrencyGovernance.WRONG_STAGE
        )
        expect(await StageTestCG.inRevealPhase()).to.be.true
      } else {
        throw Error('checkModifiers: bad stage input')
      }
    }

    describe('propose stage', () => {
      it('starts in propose stage', async () => {
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)
      })

      it('check middle of propose stage', async () => {
        await time.increase((PROPOSE_STAGE_LENGTH * 2) / 10)
        const stageInfo1 = await StageTestCG.getCurrentStage()
        expect(stageInfo1.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo1.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)

        await time.increase((PROPOSE_STAGE_LENGTH * 5) / 10)
        const stageInfo2 = await StageTestCG.getCurrentStage()
        expect(stageInfo2.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo2.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)
      })

      it('test near end of propose stage', async () => {
        await time.increase(PROPOSE_STAGE_LENGTH - 1000)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)
      })

      it('test end of propose stage', async () => {
        await time.increase(PROPOSE_STAGE_LENGTH - 1)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)
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
        await checkStageModifiers(COMMIT_STAGE)
      })

      it('test middle of commit stage', async () => {
        await time.increase((COMMIT_STAGE_LENGTH * 3) / 5)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(COMMIT_STAGE)
        await checkStageModifiers(COMMIT_STAGE)
      })

      it('test near end of commit stage', async () => {
        await time.increase(COMMIT_STAGE_LENGTH - 1000)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(COMMIT_STAGE)
        await checkStageModifiers(COMMIT_STAGE)
      })

      it('test end of commit stage', async () => {
        await time.increase(COMMIT_STAGE_LENGTH - 1)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(COMMIT_STAGE)
        await checkStageModifiers(COMMIT_STAGE)
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
        await checkStageModifiers(REVEAL_STAGE)
      })

      it('test middle of reveal stage', async () => {
        await time.increase((REVEAL_STAGE_LENGTH * 1) / 5)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(REVEAL_STAGE)
        await checkStageModifiers(REVEAL_STAGE)
      })

      it('test near end of reveal stage', async () => {
        await time.increase(REVEAL_STAGE_LENGTH - 1000)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(REVEAL_STAGE)
        await checkStageModifiers(REVEAL_STAGE)
      })

      it('test end of reveal stage', async () => {
        await time.increase(REVEAL_STAGE_LENGTH - 1)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle)).to.be.true
        expect(stageInfo.currentStage).to.equal(REVEAL_STAGE)
        await checkStageModifiers(REVEAL_STAGE)
      })
    })

    describe('cycle tests', () => {
      const completedCycles = 20
      beforeEach(async () => {
        await time.increase(CYCLE_LENGTH * completedCycles)
      })

      it('test end of cycle', async () => {
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle.eq(initialCycle + completedCycles)).to.be.true
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)
      })

      it('test forward incompleteness', async () => {
        await expect(
          StageTestCG.cycleCompleted(initialCycle + completedCycles)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INCOMPLETE)
        await expect(
          StageTestCG.cycleCompleted(initialCycle + completedCycles + 1)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INCOMPLETE)
        await expect(
          StageTestCG.cycleCompleted(initialCycle + completedCycles + 2)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INCOMPLETE)
        await expect(
          StageTestCG.cycleCompleted(initialCycle + completedCycles + 10)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INCOMPLETE)
        await expect(
          StageTestCG.cycleCompleted(initialCycle + completedCycles + 1000)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.CYCLE_INCOMPLETE)
      })

      it('test past completeness', async () => {
        expect(await StageTestCG.cycleCompleted(initialCycle + completedCycles - 1)).to.be.true
        expect(await StageTestCG.cycleCompleted(initialCycle + completedCycles - 2)).to.be.true
        expect(await StageTestCG.cycleCompleted(initialCycle + completedCycles - 10)).to.be
          .true
        expect(await StageTestCG.cycleCompleted(0)).to.be.true
      })
    })
  })

  describe('proposal stage', () => {
    describe('getProposalId', () => {
      it('matches .ts implementation', async () => {
        const solHash = await CurrencyGovernance.getProposalId(initialCycle, targets, functions, calldatas)
        const tsHash = getProposalId(initialCycle, targets, functions, calldatas)
        expect(tsHash).to.eq(solHash)
      })
    })

    describe('propose', () => {
      it('can propose', async () => {
        await CurrencyGovernance.connect(bob).propose(targets, functions, calldatas, description)
      })

      it('propose changes state correctly', async () => {
        await CurrencyGovernance.connect(bob).propose(targets, functions, calldatas, description)

        const cycle = await CurrencyGovernance.getCurrentCycle()
        const proposalId = getProposalId(cycle.toNumber(), targets, functions, calldatas)

        const proposal = await CurrencyGovernance.proposals(proposalId)
        expect(proposal.id).to.eq(proposalId)
        expect(proposal.support.toNumber()).to.eq(1)
        expect(proposal.description).to.eq(description)

        const _targets = await CurrencyGovernance.getProposalTargets(proposalId)
        expect(_targets).to.eql(targets)

        const _functions = await CurrencyGovernance.getProposalSignatures(proposalId)
        expect(_functions).to.eql(functions)

        const _calldatas = await CurrencyGovernance.getProposalCalldatas(proposalId)
        expect(_calldatas).to.eql(calldatas)

        const aliceSupport = await CurrencyGovernance.getProposalSupporter(proposalId, alice.address)
        expect(aliceSupport).to.be.false

        const bobSupport = await CurrencyGovernance.getProposalSupporter(proposalId, bob.address)
        expect(bobSupport).to.be.true
      })

      it('emits an ProposalCreation event', async () => {
        await expect(CurrencyGovernance.connect(bob).propose(targets, functions, calldatas, description))
          .to.emit(CurrencyGovernance, 'ProposalCreation')
          .withArgs(
            bob.address,
            initialCycle,
            getProposalId(initialCycle, targets, functions, calldatas),
            description,
          )
      })

      it('emits an Support event', async () => {
        await expect(CurrencyGovernance.connect(bob).propose(targets, functions, calldatas, description))
          .to.emit(CurrencyGovernance, 'Support')
          .withArgs(
            bob.address,
            getProposalId(initialCycle, targets, functions, calldatas),
            initialCycle,
          )
      })
    })
  })
})
