import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { expect } from 'chai'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { DAY } from '../../utils/constants'
import { ERRORS } from '../../utils/errors'
import { deploy } from '../../../deploy/utils'
import {
  DummyMonetaryPolicyAdapter,
  StageTestCurrencyGovernance,
} from '../../../typechain-types/contracts/test'
import { Policy } from '../../../typechain-types/contracts/policy'
import {
  DummyMonetaryPolicyAdapter__factory,
  StageTestCurrencyGovernance__factory,
} from '../../../typechain-types/factories/contracts/test'
import {
  CurrencyGovernance__factory,
  TrustedNodes__factory,
} from '../../../typechain-types/factories/contracts/governance/monetary'
import {
  TrustedNodes,
  CurrencyGovernance,
} from '../../../typechain-types/contracts/governance/monetary'

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
const description = "here's a description for the proposal"
const targetsAlt = [PLACEHOLDER_ADDRESS2, PLACEHOLDER_ADDRESS1]
const functionsAlt = ['0xabeaeacd', '0xabc3d234']
const calldatasAlt = ['0x1423', '0x123490abcdef']
const descriptionAlt = "here's another description for the proposal"

const getProposalId = (
  cycle: number,
  targets: string[],
  functions: string[],
  calldatas: string[]
) => {
  const packing = ethers.utils.defaultAbiCoder.encode(
    ['address[]', 'bytes4[]', 'bytes[]'],
    [targets, functions, calldatas]
  )
  const intermediateHash = ethers.utils.keccak256(packing)
  return ethers.utils.solidityKeccak256(
    ['uint256', 'bytes32'],
    [cycle, intermediateHash]
  )
}

interface Vote {
  proposalId: string
  score: number
}

interface CommitHashData {
  salt: string
  cycle: number
  submitterAddress: string
  votes: Vote[]
}

const hash = (data: CommitHashData) => {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      [
        'bytes32',
        'uint256',
        'address',
        '(bytes32 proposalId, uint256 score)[]',
      ],
      [data.salt, data.cycle, data.submitterAddress, data.votes]
    )
  )
}

describe('CurrencyGovernance', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress
  let dave: SignerWithAddress
  let niko: SignerWithAddress
  let mila: SignerWithAddress
  let policyImpersonator: SignerWithAddress
  before(async () => {
    ;[policyImpersonator, alice, bob, charlie, dave, niko, mila] =
      await ethers.getSigners()
  })

  let TrustedNodes: MockContract<TrustedNodes>
  let Enacter: MockContract<DummyMonetaryPolicyAdapter>
  let CurrencyGovernance: CurrencyGovernance
  let Fake__Policy: FakeContract<Policy>

  const getFormattedBallot = async (_ballot: string[]) => {
    const ballot = _ballot.slice().reverse() // sort ballot from least voted to most voted
    const cycle = (await CurrencyGovernance.getCurrentCycle()).toHexString()
    const defaultProposalId = ethers.utils.hexZeroPad(cycle, 32)

    const supports = (
      await Promise.all(
        ballot.map((proposalId) => {
          return CurrencyGovernance.proposals(proposalId)
        })
      )
    ).map((proposal, index) => {
      let support
      if (ballot[index] === defaultProposalId) {
        support = proposal.support.toNumber() + 1
      } else {
        support = proposal.support.toNumber()
      }
      return support
    })

    let scoreAcc = 0
    const ballotObj: Vote[] = ballot.map((proposalId, index) => {
      scoreAcc += supports[index]
      return {
        proposalId: proposalId.toLowerCase(),
        score: scoreAcc,
      }
    })

    return ballotObj.sort((a, b) =>
      a.proposalId.localeCompare(b.proposalId, 'en')
    )
  }

  const getCommit = async (
    salt: string,
    cycle: number,
    submitterAddress: string,
    ballot: string[]
  ) => {
    const votes = await getFormattedBallot(ballot)
    return hash({ salt, cycle, submitterAddress, votes })
  }

  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'contracts/policy/Policy.sol:Policy',
      { address: policyImpersonator.address } // This allows us to make calls from the address
    )

    Enacter = await (
      await smock.mock<DummyMonetaryPolicyAdapter__factory>(
        'contracts/test/DummyMonetaryPolicyAdapter.sol:DummyMonetaryPolicyAdapter'
      )
    ).deploy(Fake__Policy.address)

    const termStart = (await time.latest()) + 100

    CurrencyGovernance = (await deploy(
      policyImpersonator,
      CurrencyGovernance__factory,
      [Fake__Policy.address, Enacter.address, 1, termStart]
    )) as CurrencyGovernance

    TrustedNodes = await (
      await smock.mock<TrustedNodes__factory>(
        'contracts/governance/monetary/TrustedNodes.sol:TrustedNodes'
      )
    ).deploy(
      Fake__Policy.address,
      CurrencyGovernance.address,
      PLACEHOLDER_ADDRESS1, // ecox address not necessary for test
      termStart,
      1000 * DAY,
      1,
      [bob.address, charlie.address, dave.address, niko.address, mila.address]
    )

    await Enacter.connect(policyImpersonator).setCurrencyGovernance(
      CurrencyGovernance.address
    )

    await CurrencyGovernance.connect(policyImpersonator).setTrustedNodes(
      TrustedNodes.address
    )
  })

  describe('trustee role', () => {
    it('trustees can call onlyTrusted functions', async () => {
      await time.increaseTo(await CurrencyGovernance.governanceStartTime())
      await CurrencyGovernance.connect(bob).propose(
        targets,
        functions,
        calldatas,
        description
      )
    })

    it('non-trustees cannot call onlyTrusted functions', async () => {
      await time.increaseTo(await CurrencyGovernance.governanceStartTime())
      await expect(
        CurrencyGovernance.connect(alice).propose(
          targets,
          functions,
          calldatas,
          description
        )
      ).to.be.revertedWith(ERRORS.CurrencyGovernance.TRUSTEE_ONLY)
    })
  })

  describe('enacter role', () => {
    it('can be changed by the policy', async () => {
      const initialEnacterAddress = await CurrencyGovernance.enacter()
      await CurrencyGovernance.connect(policyImpersonator).setEnacter(
        alice.address
      )
      const changedEnacterAddress = await CurrencyGovernance.enacter()
      expect(changedEnacterAddress !== initialEnacterAddress).to.be.true
      expect(changedEnacterAddress === alice.address).to.be.true
    })

    it('emits an event', async () => {
      expect(
        await CurrencyGovernance.connect(policyImpersonator).setEnacter(
          alice.address
        )
      )
        .to.emit(CurrencyGovernance, 'NewEnacter')
        .withArgs(Enacter.address, alice.address)
    })

    it('is onlyPolicy gated', async () => {
      await expect(
        CurrencyGovernance.connect(alice).setEnacter(alice.address)
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    })

    it('cannot be set to the zero address', async () => {
      await expect(
        CurrencyGovernance.connect(policyImpersonator).setEnacter(
          constants.AddressZero
        )
      ).to.be.revertedWith(ERRORS.CurrencyGovernance.REQUIRE_NON_ZERO_ENACTER)
    })
  })

  describe('trusted nodes role', () => {
    let newTrustedNodes: MockContract<TrustedNodes>

    beforeEach(async () => {
      newTrustedNodes = await (
        await smock.mock<TrustedNodes__factory>(
          'contracts/governance/monetary/TrustedNodes.sol:TrustedNodes'
        )
      ).deploy(
        Fake__Policy.address,
        CurrencyGovernance.address,
        PLACEHOLDER_ADDRESS1, // ecox address not necessary for test
        await time.latest(),
        1000 * DAY,
        1,
        [bob.address, charlie.address]
      )
    })

    it('can be changed by the policy', async () => {
      const initialTNAddress = await CurrencyGovernance.trustedNodes()
      await CurrencyGovernance.connect(policyImpersonator).setTrustedNodes(
        newTrustedNodes.address
      )
      const changedTNAddress = await CurrencyGovernance.trustedNodes()
      expect(changedTNAddress !== initialTNAddress).to.be.true
      expect(changedTNAddress === newTrustedNodes.address).to.be.true
    })

    it('emits an event', async () => {
      expect(
        await CurrencyGovernance.connect(policyImpersonator).setTrustedNodes(
          newTrustedNodes.address
        )
      )
        .to.emit(CurrencyGovernance, 'NewTrustedNodes')
        .withArgs(TrustedNodes.address, newTrustedNodes.address)
    })

    it('is onlyPolicy gated', async () => {
      await expect(
        CurrencyGovernance.connect(alice).setTrustedNodes(
          newTrustedNodes.address
        )
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    })

    it('cannot be set to the zero address', async () => {
      await expect(
        CurrencyGovernance.connect(policyImpersonator).setTrustedNodes(
          constants.AddressZero
        )
      ).to.be.revertedWith(
        'Transaction reverted: function returned an unexpected amount of data'
      )
    })

    it("cannot be set if there's not enough trustees to hit quorum", async () => {
      await CurrencyGovernance.connect(policyImpersonator).setQuorum(3) // more than the trustees in newTrustedNodes
      await expect(
        CurrencyGovernance.connect(policyImpersonator).setTrustedNodes(
          newTrustedNodes.address
        )
      ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_QUORUM)
    })
  })

  describe('getCurrentCycle', async () => {
    // this function gates all important governance functions
    it('reverts if called before governanceStartTime', async () => {
      await expect(CurrencyGovernance.getCurrentCycle()).to.be.reverted
    })
    it('doesnt if called not before governanceStartTime', async () => {
      await time.increaseTo(
        (await CurrencyGovernance.governanceStartTime()).add(1)
      )
      await expect(CurrencyGovernance.getCurrentCycle()).to.not.be.reverted
    })
  })
  describe('quorum', () => {
    it('can be changed by the policy', async () => {
      const initialQuorum = await CurrencyGovernance.quorum()
      await CurrencyGovernance.connect(policyImpersonator).setQuorum(
        initialQuorum.add(1)
      )
      const newQuorum = await CurrencyGovernance.quorum()
      expect(newQuorum).to.eq(initialQuorum.add(1))
    })
    it('emits an event', async () => {
      const initialQuorum = await CurrencyGovernance.quorum()
      expect(
        await CurrencyGovernance.connect(policyImpersonator).setQuorum(
          initialQuorum.add(1)
        )
      )
        .to.emit(CurrencyGovernance, 'NewQuorum')
        .withArgs(initialQuorum, initialQuorum.add(1))
    })
    it('is onlyPolicy gated', async () => {
      const initialQuorum = await CurrencyGovernance.quorum()
      await expect(
        CurrencyGovernance.connect(alice).setQuorum(initialQuorum.add(1))
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    })

    it('cannot be set to be greater than the number of trustees', async () => {
      await expect(
        CurrencyGovernance.connect(policyImpersonator).setQuorum(
          (await TrustedNodes.numTrustees()).add(1)
        )
      ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_QUORUM)
    })
    it('cannot be set to zero', async () => {
      await expect(
        CurrencyGovernance.connect(policyImpersonator).setQuorum(0)
      ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_QUORUM)
    })
  })

  describe('time calculations', () => {
    let StageTestCG: StageTestCurrencyGovernance

    beforeEach(async () => {
      StageTestCG = await new StageTestCurrencyGovernance__factory()
        .connect(policyImpersonator)
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
        expect(stageInfo.currentCycle).to.eq(initialCycle)
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)
      })

      it('check middle of propose stage', async () => {
        await time.increase((PROPOSE_STAGE_LENGTH * 2) / 10)
        const stageInfo1 = await StageTestCG.getCurrentStage()
        expect(stageInfo1.currentCycle).to.eq(initialCycle)
        expect(stageInfo1.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)

        await time.increase((PROPOSE_STAGE_LENGTH * 5) / 10)
        const stageInfo2 = await StageTestCG.getCurrentStage()
        expect(stageInfo2.currentCycle).to.eq(initialCycle)
        expect(stageInfo2.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)
      })

      it('test near end of propose stage', async () => {
        await time.increase(PROPOSE_STAGE_LENGTH - 1000)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle).to.eq(initialCycle)
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)
      })

      it('test end of propose stage', async () => {
        await time.increase(PROPOSE_STAGE_LENGTH - 1)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle).to.eq(initialCycle)
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
        expect(stageInfo.currentCycle).to.eq(initialCycle)
        expect(stageInfo.currentStage).to.equal(COMMIT_STAGE)
        await checkStageModifiers(COMMIT_STAGE)
      })

      it('test middle of commit stage', async () => {
        await time.increase((COMMIT_STAGE_LENGTH * 3) / 5)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle).to.eq(initialCycle)
        expect(stageInfo.currentStage).to.equal(COMMIT_STAGE)
        await checkStageModifiers(COMMIT_STAGE)
      })

      it('test near end of commit stage', async () => {
        await time.increase(COMMIT_STAGE_LENGTH - 1000)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle).to.eq(initialCycle)
        expect(stageInfo.currentStage).to.equal(COMMIT_STAGE)
        await checkStageModifiers(COMMIT_STAGE)
      })

      it('test end of commit stage', async () => {
        await time.increase(COMMIT_STAGE_LENGTH - 1)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle).to.eq(initialCycle)
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
        expect(stageInfo.currentCycle).to.eq(initialCycle)
        expect(stageInfo.currentStage).to.equal(REVEAL_STAGE)
        await checkStageModifiers(REVEAL_STAGE)
      })

      it('test middle of reveal stage', async () => {
        await time.increase((REVEAL_STAGE_LENGTH * 1) / 5)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle).to.eq(initialCycle)
        expect(stageInfo.currentStage).to.equal(REVEAL_STAGE)
        await checkStageModifiers(REVEAL_STAGE)
      })

      it('test near end of reveal stage', async () => {
        await time.increase(REVEAL_STAGE_LENGTH - 1000)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle).to.eq(initialCycle)
        expect(stageInfo.currentStage).to.equal(REVEAL_STAGE)
        await checkStageModifiers(REVEAL_STAGE)
      })

      it('test end of reveal stage', async () => {
        await time.increase(REVEAL_STAGE_LENGTH - 1)
        const stageInfo = await StageTestCG.getCurrentStage()
        expect(stageInfo.currentCycle).to.eq(initialCycle)
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
        expect(stageInfo.currentCycle.eq(initialCycle + completedCycles)).to.be
          .true
        expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)
        await checkStageModifiers(PROPOSE_STAGE)
      })
    })
  })

  describe('proposal stage', () => {
    describe('getProposalId', () => {
      it('matches .ts implementation', async () => {
        const solHash = await CurrencyGovernance.getProposalId(
          initialCycle,
          targets,
          functions,
          calldatas
        )
        const tsHash = getProposalId(
          initialCycle,
          targets,
          functions,
          calldatas
        )
        expect(tsHash).to.eq(solHash)
      })
    })

    describe('propose', () => {
      beforeEach(async () => {
        await time.increaseTo(await CurrencyGovernance.governanceStartTime())
      })
      it('can propose', async () => {
        await CurrencyGovernance.connect(bob).propose(
          targets,
          functions,
          calldatas,
          description
        )
      })

      it('propose changes state correctly', async () => {
        await CurrencyGovernance.connect(bob).propose(
          targets,
          functions,
          calldatas,
          description
        )

        const proposalId = getProposalId(
          initialCycle,
          targets,
          functions,
          calldatas
        )

        const proposal = await CurrencyGovernance.proposals(proposalId)
        expect(proposal.cycle).to.eq(initialCycle)
        expect(proposal.support.toNumber()).to.eq(1)
        expect(proposal.description).to.eq(description)

        const _targets = await CurrencyGovernance.getProposalTargets(proposalId)
        expect(_targets).to.eql(targets)

        const _functions = await CurrencyGovernance.getProposalSignatures(
          proposalId
        )
        expect(_functions).to.eql(functions)

        const _calldatas = await CurrencyGovernance.getProposalCalldatas(
          proposalId
        )
        expect(_calldatas).to.eql(calldatas)

        const aliceSupport = await CurrencyGovernance.getProposalSupporter(
          proposalId,
          alice.address
        )
        expect(aliceSupport).to.be.false

        const bobSupport = await CurrencyGovernance.getProposalSupporter(
          proposalId,
          bob.address
        )
        expect(bobSupport).to.be.true

        const bobSupportGuard = await CurrencyGovernance.trusteeSupports(
          bob.address
        )
        expect(bobSupportGuard).to.eq(initialCycle)
      })

      it('emits an ProposalCreation event', async () => {
        await expect(
          CurrencyGovernance.connect(bob).propose(
            targets,
            functions,
            calldatas,
            description
          )
        )
          .to.emit(CurrencyGovernance, 'ProposalCreation')
          .withArgs(
            bob.address,
            initialCycle,
            getProposalId(initialCycle, targets, functions, calldatas),
            description
          )
      })

      it('emits an Support event', async () => {
        await expect(
          CurrencyGovernance.connect(bob).propose(
            targets,
            functions,
            calldatas,
            description
          )
        )
          .to.emit(CurrencyGovernance, 'Support')
          .withArgs(
            bob.address,
            getProposalId(initialCycle, targets, functions, calldatas),
            initialCycle
          )
      })

      describe('reverts', () => {
        it('must be a trustee', async () => {
          await expect(
            CurrencyGovernance.connect(alice).propose(
              targets,
              functions,
              calldatas,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.TRUSTEE_ONLY)
        })

        it('must be during propose phase', async () => {
          await time.increase(PROPOSE_STAGE_LENGTH)
          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              functions,
              calldatas,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.WRONG_STAGE)
        })

        it('cannot propose if already supporting', async () => {
          await CurrencyGovernance.connect(bob).propose(
            targets,
            functions,
            calldatas,
            description
          )
          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              functions,
              calldatas,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ALREADY_SUPPORTED)
        })

        it('description must be below the max', async () => {
          const tooLongDescription = '7x23=it'.repeat(23)
          const maximalDescription = 'goodsize'.repeat(20)
          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              functions,
              calldatas,
              tooLongDescription
            )
          ).to.be.revertedWith(
            `${ERRORS.CurrencyGovernance.DESCRIPTION_TOO_LONG}(161)`
          )
          await CurrencyGovernance.connect(bob).propose(
            targets,
            functions,
            calldatas,
            maximalDescription
          )
        })

        it('target array length', async () => {
          const tooLongTargets = [
            PLACEHOLDER_ADDRESS1,
            PLACEHOLDER_ADDRESS1,
            PLACEHOLDER_ADDRESS1,
            PLACEHOLDER_ADDRESS1,
            PLACEHOLDER_ADDRESS1,
            PLACEHOLDER_ADDRESS1,
            PLACEHOLDER_ADDRESS1,
            PLACEHOLDER_ADDRESS1,
            PLACEHOLDER_ADDRESS1,
            PLACEHOLDER_ADDRESS1,
            PLACEHOLDER_ADDRESS1,
          ]
          const tooShortTargets: string[] = []

          await expect(
            CurrencyGovernance.connect(bob).propose(
              tooLongTargets,
              functions,
              calldatas,
              description
            )
          ).to.be.revertedWith(
            `${ERRORS.CurrencyGovernance.TARGETS_TOO_LONG_OR_ZERO}(11)`
          )

          await expect(
            CurrencyGovernance.connect(bob).propose(
              tooShortTargets,
              functions,
              calldatas,
              description
            )
          ).to.be.revertedWith(
            `${ERRORS.CurrencyGovernance.TARGETS_TOO_LONG_OR_ZERO}(0)`
          )
        })

        it('array mismatches', async () => {
          const tooLongSignatures1 = ['0x12341234', '0x12341234', '0x12341234']
          const tooLongSignatures2 = [
            '0x12341234',
            '0x12341234',
            '0x12341234',
            '0x12341234',
            '0x12341234',
          ]
          const tooShortSignatures1 = ['0x12341234']
          const tooShortSignatures2: string[] = []
          const tooLongCalldata1 = [
            '0x123412123134',
            '0x144423131234',
            '0x2341313131311234',
          ]
          const tooLongCalldata2 = [
            '0x13',
            '0x23411234',
            '0x2123341234',
            '0x1234',
            '0x1234121334',
          ]
          const tooShortCalldata1 = ['0x12341234123123']
          const tooShortCalldata2: string[] = []

          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              tooLongSignatures1,
              calldatas,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ARRAYS_BAD_LENGTH)

          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              tooLongSignatures2,
              calldatas,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ARRAYS_BAD_LENGTH)

          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              tooShortSignatures1,
              calldatas,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ARRAYS_BAD_LENGTH)

          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              tooShortSignatures2,
              calldatas,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ARRAYS_BAD_LENGTH)

          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              functions,
              tooLongCalldata1,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ARRAYS_BAD_LENGTH)

          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              functions,
              tooLongCalldata2,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ARRAYS_BAD_LENGTH)

          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              functions,
              tooShortCalldata1,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ARRAYS_BAD_LENGTH)

          await expect(
            CurrencyGovernance.connect(bob).propose(
              targets,
              functions,
              tooShortCalldata2,
              description
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ARRAYS_BAD_LENGTH)
        })

        it('another trustee trying to submit the same proposal', async () => {
          const secondDescription = "I'm another description"
          await CurrencyGovernance.connect(bob).propose(
            targets,
            functions,
            calldatas,
            description
          )

          await expect(
            CurrencyGovernance.connect(charlie).propose(
              targets,
              functions,
              calldatas,
              secondDescription
            )
          ).to.be.revertedWith(
            ERRORS.CurrencyGovernance.PROPOSALID_ALREADY_EXISTS
          )
        })
      })
    })

    describe('supportProposal', () => {
      const proposalId = getProposalId(
        initialCycle,
        targets,
        functions,
        calldatas
      )
      beforeEach(async () => {
        await time.increaseTo(await CurrencyGovernance.governanceStartTime())
        await CurrencyGovernance.connect(bob).propose(
          targets,
          functions,
          calldatas,
          description
        )
      })

      it('can support', async () => {
        await CurrencyGovernance.connect(charlie).supportProposal(proposalId)
      })

      it('support modifies state correctly', async () => {
        const charlieSupportGuardBefore =
          await CurrencyGovernance.trusteeSupports(charlie.address)
        expect(charlieSupportGuardBefore.toNumber()).to.eq(0)
        const proposalSupportBefore = (
          await CurrencyGovernance.proposals(proposalId)
        ).support
        expect(proposalSupportBefore.toNumber()).to.eq(1)
        const proposalSupportersBefore =
          await CurrencyGovernance.getProposalSupporter(
            proposalId,
            charlie.address
          )
        expect(proposalSupportersBefore).to.be.false

        await CurrencyGovernance.connect(charlie).supportProposal(proposalId)

        const charlieSupportGuardAfter =
          await CurrencyGovernance.trusteeSupports(charlie.address)
        expect(charlieSupportGuardAfter.toNumber()).to.eq(initialCycle)
        const proposalSupportAfter = (
          await CurrencyGovernance.proposals(proposalId)
        ).support
        expect(proposalSupportAfter.toNumber()).to.eq(2)
        const proposalSupportersAfter =
          await CurrencyGovernance.getProposalSupporter(
            proposalId,
            charlie.address
          )
        expect(proposalSupportersAfter).to.be.true
      })

      it('support emits an event', async () => {
        await expect(
          CurrencyGovernance.connect(charlie).supportProposal(proposalId)
        )
          .to.emit(CurrencyGovernance, 'Support')
          .withArgs(charlie.address, proposalId, initialCycle)
      })

      it('can support the default proposal', async () => {
        const defaultProposalId = ethers.utils.hexZeroPad(
          ethers.BigNumber.from(initialCycle).toHexString(),
          32
        )
        await CurrencyGovernance.connect(charlie).supportProposal(
          defaultProposalId
        )
      })

      describe('reverts', () => {
        it('trustee only', async () => {
          await expect(
            CurrencyGovernance.connect(alice).supportProposal(proposalId)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.TRUSTEE_ONLY)
        })

        it('only during propose phase', async () => {
          await time.increase(PROPOSE_STAGE_LENGTH)
          await expect(
            CurrencyGovernance.connect(bob).supportProposal(proposalId)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.WRONG_STAGE)
        })

        it('support if already supporting', async () => {
          await expect(
            CurrencyGovernance.connect(bob).supportProposal(proposalId)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ALREADY_SUPPORTED)
          await CurrencyGovernance.connect(charlie).supportProposal(proposalId)
          await expect(
            CurrencyGovernance.connect(charlie).supportProposal(proposalId)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.ALREADY_SUPPORTED)
        })

        it('supporting a non-proposal', async () => {
          const badProposalId = getProposalId(0, [], [], [])
          await expect(
            CurrencyGovernance.connect(charlie).supportProposal(badProposalId)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.PROPOSALID_INVALID)
          await expect(
            CurrencyGovernance.connect(charlie).supportProposal(
              ethers.utils.hexZeroPad('0x', 32)
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.PROPOSALID_INVALID)
        })

        it('supporting a future default proposal', async () => {
          await expect(
            CurrencyGovernance.connect(charlie).supportProposal(
              ethers.utils.hexZeroPad(
                ethers.BigNumber.from(initialCycle + 1).toHexString(),
                32
              )
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.PROPOSALID_INVALID)
        })
      })
    })

    describe('unsupportProposal', () => {
      const proposalId = getProposalId(
        initialCycle,
        targets,
        functions,
        calldatas
      )
      beforeEach(async () => {
        await time.increaseTo(await CurrencyGovernance.governanceStartTime())
        await CurrencyGovernance.connect(bob).propose(
          targets,
          functions,
          calldatas,
          description
        )
        await CurrencyGovernance.connect(charlie).supportProposal(proposalId)
      })

      it('can unsupport', async () => {
        await CurrencyGovernance.connect(charlie).unsupportProposal(proposalId)
      })

      it('can unsupport as proposer', async () => {
        await CurrencyGovernance.connect(bob).unsupportProposal(proposalId)
      })

      it('unsupport modifies state correctly', async () => {
        const charlieSupportGuardBefore =
          await CurrencyGovernance.trusteeSupports(charlie.address)
        expect(charlieSupportGuardBefore.toNumber()).to.eq(initialCycle)
        const proposalSupportBefore = (
          await CurrencyGovernance.proposals(proposalId)
        ).support
        expect(proposalSupportBefore.toNumber()).to.eq(2)
        const proposalSupportersBefore =
          await CurrencyGovernance.getProposalSupporter(
            proposalId,
            charlie.address
          )
        expect(proposalSupportersBefore).to.be.true

        await CurrencyGovernance.connect(charlie).unsupportProposal(proposalId)

        const charlieSupportGuardAfter =
          await CurrencyGovernance.trusteeSupports(charlie.address)
        expect(charlieSupportGuardAfter.toNumber()).to.eq(0)
        const proposalSupportAfter = (
          await CurrencyGovernance.proposals(proposalId)
        ).support
        expect(proposalSupportAfter.toNumber()).to.eq(1)
        const proposalSupportersAfter =
          await CurrencyGovernance.getProposalSupporter(
            proposalId,
            charlie.address
          )
        expect(proposalSupportersAfter).to.be.false
      })

      it('unsupport deletion clears state correctly', async () => {
        await CurrencyGovernance.connect(bob).unsupportProposal(proposalId)
        await CurrencyGovernance.connect(charlie).unsupportProposal(proposalId)

        const proposal = await CurrencyGovernance.proposals(proposalId)
        expect(proposal.cycle).to.eq(0)
        expect(proposal.support.toNumber()).to.eq(0)
        expect(proposal.description).to.eq('')

        const _targets = await CurrencyGovernance.getProposalTargets(proposalId)
        expect(_targets).to.eql([])

        const _functions = await CurrencyGovernance.getProposalSignatures(
          proposalId
        )
        expect(_functions).to.eql([])

        const _calldatas = await CurrencyGovernance.getProposalCalldatas(
          proposalId
        )
        expect(_calldatas).to.eql([])

        const aliceSupport = await CurrencyGovernance.getProposalSupporter(
          proposalId,
          alice.address
        )
        expect(aliceSupport).to.be.false

        const bobSupport = await CurrencyGovernance.getProposalSupporter(
          proposalId,
          bob.address
        )
        expect(bobSupport).to.be.false

        const charlieSupport = await CurrencyGovernance.getProposalSupporter(
          proposalId,
          charlie.address
        )
        expect(charlieSupport).to.be.false
      })

      it('unsupport deletion allows reproposal', async () => {
        await CurrencyGovernance.connect(bob).unsupportProposal(proposalId)
        await CurrencyGovernance.connect(charlie).unsupportProposal(proposalId)
        await CurrencyGovernance.connect(dave).propose(
          targets,
          functions,
          calldatas,
          description
        )
      })

      it('emits an Unsupport event', async () => {
        await expect(
          CurrencyGovernance.connect(charlie).unsupportProposal(proposalId)
        )
          .to.emit(CurrencyGovernance, 'Unsupport')
          .withArgs(charlie.address, proposalId, initialCycle)
      })

      it('emits a ProposalDeleted event', async () => {
        await CurrencyGovernance.connect(charlie).unsupportProposal(proposalId)
        await expect(
          CurrencyGovernance.connect(bob).unsupportProposal(proposalId)
        )
          .to.emit(CurrencyGovernance, 'ProposalDeleted')
          .withArgs(proposalId, initialCycle)
      })

      it("doesn't emit a ProposalDeleted event for the default proposal", async () => {
        const defaultProposalId = ethers.utils.hexZeroPad(
          ethers.BigNumber.from(initialCycle).toHexString(),
          32
        )
        await CurrencyGovernance.connect(dave).supportProposal(
          defaultProposalId
        )
        await expect(
          CurrencyGovernance.connect(dave).unsupportProposal(defaultProposalId)
        ).to.not.emit(CurrencyGovernance, 'ProposalDeleted')
      })

      describe('reverts', () => {
        it('trustee only', async () => {
          await expect(
            CurrencyGovernance.connect(alice).unsupportProposal(proposalId)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.TRUSTEE_ONLY)
        })

        it('only during propose phase', async () => {
          await time.increase(PROPOSE_STAGE_LENGTH)
          await expect(
            CurrencyGovernance.connect(bob).supportProposal(proposalId)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.WRONG_STAGE)
        })

        it('unsupporting a non-proposal', async () => {
          const badProposalId = getProposalId(0, [], [], [])
          await expect(
            CurrencyGovernance.connect(charlie).unsupportProposal(badProposalId)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.PROPOSALID_INVALID)
          await expect(
            CurrencyGovernance.connect(charlie).unsupportProposal(
              ethers.utils.hexZeroPad('0x', 32)
            )
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.PROPOSALID_INVALID)
        })

        it('unsupport if not actually supported', async () => {
          await expect(
            CurrencyGovernance.connect(dave).unsupportProposal(proposalId)
          ).to.be.revertedWith(
            ERRORS.CurrencyGovernance.UNSUPPORT_WITH_NO_SUPPORT
          )
        })
      })
    })
  })

  describe('commit stage', () => {
    const bobProposalId = getProposalId(
      initialCycle,
      targets,
      functions,
      calldatas
    )
    const charlieProposalId = getProposalId(
      initialCycle,
      targetsAlt,
      functionsAlt,
      calldatasAlt
    )
    beforeEach(async () => {
      await time.increaseTo(await CurrencyGovernance.governanceStartTime())
      await CurrencyGovernance.connect(bob).propose(
        targets,
        functions,
        calldatas,
        description
      )
      await CurrencyGovernance.connect(charlie).propose(
        targetsAlt,
        functionsAlt,
        calldatasAlt,
        descriptionAlt
      )
      await CurrencyGovernance.connect(dave).supportProposal(charlieProposalId)
      await time.increase(PROPOSE_STAGE_LENGTH)
    })

    it('can commit', async () => {
      const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      const ballot = [bobProposalId, charlieProposalId]
      const commitHash = await getCommit(
        salt,
        initialCycle,
        bob.address,
        ballot
      )
      await CurrencyGovernance.connect(bob).commit(commitHash)
    })

    it('commit changes state', async () => {
      const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      const ballot = [bobProposalId, charlieProposalId]
      const commitHash = await getCommit(
        salt,
        initialCycle,
        bob.address,
        ballot
      )
      await CurrencyGovernance.connect(bob).commit(commitHash)

      const commitFetched = await CurrencyGovernance.commitments(bob.address)
      expect(commitFetched).to.be.eq(commitHash)
    })

    it('commit can be overwritten', async () => {
      const salt1 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      const ballot1 = [charlieProposalId, bobProposalId] // accidental wrong ballot
      const commitHash1 = await getCommit(
        salt1,
        initialCycle,
        bob.address,
        ballot1
      )
      await CurrencyGovernance.connect(bob).commit(commitHash1)

      const salt2 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      const ballot2 = [bobProposalId, charlieProposalId] // correct ballot to overwrite
      const commitHash2 = await getCommit(
        salt2,
        initialCycle,
        bob.address,
        ballot2
      )
      await CurrencyGovernance.connect(bob).commit(commitHash2)
      const commitFetched = await CurrencyGovernance.commitments(bob.address)
      expect(commitFetched).to.not.be.eq(commitHash1)
      expect(commitFetched).to.be.eq(commitHash2)
    })

    it('emits an event', async () => {
      const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      const ballot = [bobProposalId, charlieProposalId]
      const commitHash = await getCommit(
        salt,
        initialCycle,
        bob.address,
        ballot
      )
      await expect(CurrencyGovernance.connect(bob).commit(commitHash))
        .to.emit(CurrencyGovernance, 'VoteCommit')
        .withArgs(bob.address, initialCycle)
    })

    it('can commit nonsense', async () => {
      // both these cases will be prevented in revealing, not committing
      const randomHash = ethers.utils.randomBytes(32)
      await CurrencyGovernance.connect(bob).commit(randomHash)
      const zeroBytes = ethers.utils.hexZeroPad('0x', 32)
      await CurrencyGovernance.connect(charlie).commit(zeroBytes)
    })

    it('can abstain', async () => {
      await expect(CurrencyGovernance.connect(charlie).abstain())
        .to.emit(CurrencyGovernance, 'Abstain')
        .withArgs(charlie.address, initialCycle)
    })

    describe('reverts', () => {
      it('must be a trustee', async () => {
        const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32))
        const ballot = [bobProposalId, charlieProposalId]
        const commitHash = await getCommit(
          salt,
          initialCycle,
          bob.address,
          ballot
        )
        await expect(
          CurrencyGovernance.connect(alice).commit(commitHash)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.TRUSTEE_ONLY)
      })

      it('must be during commit phase', async () => {
        const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32))
        const ballot = [bobProposalId, charlieProposalId]
        const commitHash = await getCommit(
          salt,
          initialCycle,
          bob.address,
          ballot
        )

        await time.increase(REVEAL_STAGE_START)
        await expect(
          CurrencyGovernance.connect(bob).commit(commitHash)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.WRONG_STAGE)
      })

      it('cannot abstain with a commitment', async () => {
        const randomHash = ethers.utils.randomBytes(32)
        await CurrencyGovernance.connect(charlie).commit(randomHash)
        await expect(
          CurrencyGovernance.connect(charlie).abstain()
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_ABSTAIN)
      })
    })
  })

  describe('reveal stage', () => {
    const bobProposalId = getProposalId(
      initialCycle,
      targets,
      functions,
      calldatas
    )
    const charlieProposalId = getProposalId(
      initialCycle,
      targetsAlt,
      functionsAlt,
      calldatasAlt
    )
    const defaultProposalId = ethers.utils.hexZeroPad(
      ethers.BigNumber.from(initialCycle).toHexString(),
      32
    )

    beforeEach(async () => {
      await time.increaseTo(await CurrencyGovernance.governanceStartTime())
      await CurrencyGovernance.connect(bob).propose(
        targets,
        functions,
        calldatas,
        description
      )
      await CurrencyGovernance.connect(charlie).propose(
        targetsAlt,
        functionsAlt,
        calldatasAlt,
        descriptionAlt
      )
      await CurrencyGovernance.connect(dave).supportProposal(charlieProposalId)
      await CurrencyGovernance.connect(niko).supportProposal(defaultProposalId)
      await time.increase(PROPOSE_STAGE_LENGTH)
      // commits will be done in the individual tests for setting different ballots
    })

    describe('happy path voting', () => {
      const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32))
      // creates scores of charlie:5, default:3, bob:1
      const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
      let votes: Vote[]

      beforeEach(async () => {
        votes = await getFormattedBallot(ballot)
        const commitHash = await getCommit(
          salt,
          initialCycle,
          charlie.address,
          ballot
        )
        await CurrencyGovernance.connect(charlie).commit(commitHash)
      })

      it('can reveal', async () => {
        await time.increase(COMMIT_STAGE_LENGTH)
        await CurrencyGovernance.connect(charlie).reveal(
          charlie.address,
          salt,
          votes
        )
      })

      it('anyone with the salt and votes can reveal', async () => {
        await time.increase(COMMIT_STAGE_LENGTH)
        await CurrencyGovernance.connect(alice).reveal(
          charlie.address,
          salt,
          votes
        )
      })

      it('reveal emits an event', async () => {
        // hardhat withArgs for chai is bugged to not use deep equals
        // you can use this parameterization of the vote object
        // const eventVotes = votes.map((vote) => {const intermediate = [vote.proposalId, ethers.BigNumber.from(vote.score)]; intermediate['proposalId'] = vote.proposalId; intermediate['score'] = ethers.BigNumber.from(vote.score); return intermediate})
        // and then go to this line and change the `.equal` to `.eql` (a deep equals comparison)
        // at assertArgsArraysEqual (node_modules/@ethereum-waffle/chai/dist/cjs/matchers/emit.js:48:57)
        // and the uncommented code will work
        // until hardhat fixes this we will not be able to test this (tracked here https://github.com/NomicFoundation/hardhat/issues/3833)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.connect(charlie).reveal(
            charlie.address,
            salt,
            votes
          )
        ).to.emit(CurrencyGovernance, 'VoteReveal')
        // .withArgs(charlie.address, initialCycle, eventVotes)
      })

      it('reveal correctly changes state', async () => {
        await time.increase(COMMIT_STAGE_LENGTH)
        const initialParticipation = await CurrencyGovernance.participation()
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.emit(CurrencyGovernance, 'QuorumReached')
        expect(await CurrencyGovernance.participation()).to.eq(
          initialParticipation.add(1)
        )
        votes.sort((a, b) => {
          return b.score - a.score
        })
        const charlieProposalScore = (
          await CurrencyGovernance.scores(charlieProposalId)
        ).toNumber()
        expect(charlieProposalScore).to.eq(votes[0].score)
        const defaultProposalScore = (
          await CurrencyGovernance.scores(defaultProposalId)
        ).toNumber()
        expect(defaultProposalScore).to.eq(votes[1].score)
        const bobProposalScore = (
          await CurrencyGovernance.scores(bobProposalId)
        ).toNumber()
        expect(bobProposalScore).to.eq(votes[2].score)

        // charlie's commit is deleted
        const charlieCommit = await CurrencyGovernance.commitments(
          charlie.address
        )
        expect(charlieCommit).to.eq(ethers.utils.hexZeroPad('0x', 32))

        const leader = await CurrencyGovernance.leader()
        expect(leader).to.eq(charlieProposalId)
      })

      it('reveal records TrustedNodes vote', async () => {
        await time.increase(COMMIT_STAGE_LENGTH)
        expect(await TrustedNodes.votingRecord(charlie.address)).to.be.eq(0)
        await CurrencyGovernance.connect(charlie).reveal(
          charlie.address,
          salt,
          votes
        )
        expect(await TrustedNodes.votingRecord(charlie.address)).to.be.eq(1)
        expect(await TrustedNodes.votingRecord(niko.address)).to.be.eq(0)
        expect(await TrustedNodes.votingRecord(dave.address)).to.be.eq(0)
        expect(await TrustedNodes.votingRecord(bob.address)).to.be.eq(0)
      })

      it('second reveal can change the leader to the default proposal', async () => {
        // adds votes of default: 5, bob:4, charlie:2
        // total scores after both votes is default:8, charlie:7, bob:5
        const salt2 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
        const ballot2 = [defaultProposalId, bobProposalId, charlieProposalId]
        const votes2 = await getFormattedBallot(ballot2)
        const commitHash2 = await getCommit(
          salt2,
          initialCycle,
          niko.address,
          ballot2
        )
        await CurrencyGovernance.connect(niko).commit(commitHash2)

        await time.increase(COMMIT_STAGE_LENGTH)
        await CurrencyGovernance.reveal(charlie.address, salt, votes)
        await CurrencyGovernance.reveal(niko.address, salt2, votes2)

        votes.sort((a, b) => {
          return b.score - a.score
        })
        votes2.sort((a, b) => {
          return b.score - a.score
        })
        const charlieProposalScore = (
          await CurrencyGovernance.scores(charlieProposalId)
        ).toNumber()
        expect(charlieProposalScore).to.eq(votes[0].score + votes2[2].score)
        const defaultProposalScore = (
          await CurrencyGovernance.scores(defaultProposalId)
        ).toNumber()
        expect(defaultProposalScore).to.eq(votes[1].score + votes2[0].score)
        const bobProposalScore = (
          await CurrencyGovernance.scores(bobProposalId)
        ).toNumber()
        expect(bobProposalScore).to.eq(votes[2].score + votes2[1].score)

        const leader = await CurrencyGovernance.leader()
        expect(leader).to.eq(defaultProposalId)
      })

      it("second reveal that ties score, doesn't change the leader", async () => {
        // adds votes of bob: 5, default:4, charlie:2
        // total scores after first two votes is charlie:7, default:7, bob:6
        // this ties leaders and charlie prevails
        const salt2 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
        const ballot2 = [bobProposalId, defaultProposalId, charlieProposalId]
        const votes2 = await getFormattedBallot(ballot2)
        const commitHash2 = await getCommit(
          salt2,
          initialCycle,
          bob.address,
          ballot2
        )
        await CurrencyGovernance.connect(bob).commit(commitHash2)
        // adds votes of bob: 3, charlie:2
        // total scores after all votes is charlie:9, bob:9, default:6
        // bob's vote wins the internal score calculation as his vote is higher in the vote that ties
        // however scores are equal after the voting so charlie remains the leader
        const salt3 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
        const ballot3 = [bobProposalId, charlieProposalId]
        const votes3 = await getFormattedBallot(ballot3)
        const commitHash3 = await getCommit(
          salt3,
          initialCycle,
          mila.address,
          ballot3
        )
        await CurrencyGovernance.connect(mila).commit(commitHash3)

        await time.increase(COMMIT_STAGE_LENGTH)
        await CurrencyGovernance.reveal(charlie.address, salt, votes)
        await CurrencyGovernance.reveal(bob.address, salt2, votes2)
        await CurrencyGovernance.reveal(mila.address, salt3, votes3)

        votes.sort((a, b) => {
          return b.score - a.score
        })
        votes2.sort((a, b) => {
          return b.score - a.score
        })
        votes3.sort((a, b) => {
          return b.score - a.score
        })
        const charlieProposalScore = (
          await CurrencyGovernance.scores(charlieProposalId)
        ).toNumber()
        expect(charlieProposalScore).to.eq(
          votes[0].score + votes2[2].score + votes3[1].score
        )
        const defaultProposalScore = (
          await CurrencyGovernance.scores(defaultProposalId)
        ).toNumber()
        expect(defaultProposalScore).to.eq(votes[1].score + votes2[1].score)
        const bobProposalScore = (
          await CurrencyGovernance.scores(bobProposalId)
        ).toNumber()
        expect(bobProposalScore).to.eq(
          votes[2].score + votes2[0].score + votes3[0].score
        )

        const leader = await CurrencyGovernance.leader()
        expect(leader).to.eq(charlieProposalId)
      })

      it('ties with the default proposal work as expected', async () => {
        // adds votes of default: 5, charlie:3, bob:1
        // total scores after both votes is charlie:8, default:8, bob:2
        // however charlie was leader first, so he previals
        const salt2 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
        const ballot2 = [defaultProposalId, charlieProposalId, bobProposalId]
        const votes2 = await getFormattedBallot(ballot2)
        const commitHash2 = await getCommit(
          salt2,
          initialCycle,
          niko.address,
          ballot2
        )
        await CurrencyGovernance.connect(niko).commit(commitHash2)

        await time.increase(COMMIT_STAGE_LENGTH)
        await CurrencyGovernance.reveal(charlie.address, salt, votes)
        await CurrencyGovernance.reveal(niko.address, salt2, votes2)

        votes.sort((a, b) => {
          return b.score - a.score
        })
        votes2.sort((a, b) => {
          return b.score - a.score
        })
        const charlieProposalScore = (
          await CurrencyGovernance.scores(charlieProposalId)
        ).toNumber()
        expect(charlieProposalScore).to.eq(votes[0].score + votes2[1].score)
        const defaultProposalScore = (
          await CurrencyGovernance.scores(defaultProposalId)
        ).toNumber()
        expect(defaultProposalScore).to.eq(votes[1].score + votes2[0].score)
        const bobProposalScore = (
          await CurrencyGovernance.scores(bobProposalId)
        ).toNumber()
        expect(bobProposalScore).to.eq(votes[2].score + votes2[2].score)

        const leader = await CurrencyGovernance.leader()
        expect(leader).to.eq(charlieProposalId)
      })

      it('order of reveals matter in case of a tie', async () => {
        // same as previous test
        // adds votes of default: 5, charlie:3, bob:1
        // total scores after both votes is charlie:8, default:8, bob:2
        // by revealing niko's vote first, the default proposal wins instead
        const salt2 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
        const ballot2 = [defaultProposalId, charlieProposalId, bobProposalId]
        const votes2 = await getFormattedBallot(ballot2)
        const commitHash2 = await getCommit(
          salt2,
          initialCycle,
          niko.address,
          ballot2
        )
        await CurrencyGovernance.connect(niko).commit(commitHash2)

        await time.increase(COMMIT_STAGE_LENGTH)
        await CurrencyGovernance.reveal(niko.address, salt2, votes2)
        await CurrencyGovernance.reveal(charlie.address, salt, votes)

        votes.sort((a, b) => {
          return b.score - a.score
        })
        votes2.sort((a, b) => {
          return b.score - a.score
        })
        const charlieProposalScore = (
          await CurrencyGovernance.scores(charlieProposalId)
        ).toNumber()
        expect(charlieProposalScore).to.eq(votes[0].score + votes2[1].score)
        const defaultProposalScore = (
          await CurrencyGovernance.scores(defaultProposalId)
        ).toNumber()
        expect(defaultProposalScore).to.eq(votes[1].score + votes2[0].score)
        const bobProposalScore = (
          await CurrencyGovernance.scores(bobProposalId)
        ).toNumber()
        expect(bobProposalScore).to.eq(votes[2].score + votes2[2].score)

        const leader = await CurrencyGovernance.leader()
        expect(leader).to.eq(defaultProposalId)
      })

      it('reveal that creates a tie where the ballot order complicates things is handeled correctly', async () => {
        // adds votes of bob: 5, default:4, charlie:2
        // total scores after first two votes is charlie:7, default:7, bob:6
        // however, even if this vote reveals first, charlie still wins
        // it doesn't matter that default was a higher subleader on the previous vote
        // because the vote that ties has charlie getting a higher score than the default and neither were leader before, charlie wins
        const salt2 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
        const ballot2 = [bobProposalId, defaultProposalId, charlieProposalId]
        const votes2 = await getFormattedBallot(ballot2)
        const commitHash2 = await getCommit(
          salt2,
          initialCycle,
          bob.address,
          ballot2
        )
        await CurrencyGovernance.connect(bob).commit(commitHash2)

        await time.increase(COMMIT_STAGE_LENGTH)
        await CurrencyGovernance.reveal(bob.address, salt2, votes2)
        await CurrencyGovernance.reveal(charlie.address, salt, votes)

        votes.sort((a, b) => {
          return b.score - a.score
        })
        votes2.sort((a, b) => {
          return b.score - a.score
        })
        const charlieProposalScore = (
          await CurrencyGovernance.scores(charlieProposalId)
        ).toNumber()
        expect(charlieProposalScore).to.eq(votes[0].score + votes2[2].score)
        const defaultProposalScore = (
          await CurrencyGovernance.scores(defaultProposalId)
        ).toNumber()
        expect(defaultProposalScore).to.eq(votes[1].score + votes2[1].score)
        const bobProposalScore = (
          await CurrencyGovernance.scores(bobProposalId)
        ).toNumber()
        expect(bobProposalScore).to.eq(votes[2].score + votes2[0].score)

        const leader = await CurrencyGovernance.leader()
        expect(leader).to.eq(charlieProposalId)
      })
    })

    describe('reverts', () => {
      const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32))

      it('only during propose phase', async () => {
        const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
        const votes = await getFormattedBallot(ballot)
        const commitHash = await getCommit(
          salt,
          initialCycle,
          charlie.address,
          ballot
        )
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await time.increase(COMMIT_STAGE_LENGTH + REVEAL_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.WRONG_STAGE)
      })

      it("can't vote empty", async () => {
        const ballot: string[] = []
        const votes = await getFormattedBallot(ballot)
        const commitHash = await getCommit(
          salt,
          initialCycle,
          charlie.address,
          ballot
        )
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.EMPTY_VOTES_ARRAY)
      })

      describe('commit mismatch', () => {
        it('wrong salt', async () => {
          const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
          const votes = await getFormattedBallot(ballot)
          const commitHash = await getCommit(
            salt,
            initialCycle,
            charlie.address,
            ballot
          )
          await CurrencyGovernance.connect(charlie).commit(commitHash)
          await time.increase(COMMIT_STAGE_LENGTH)

          const badSalt = ethers.utils.hexlify(ethers.utils.randomBytes(32))
          await expect(
            CurrencyGovernance.reveal(charlie.address, badSalt, votes)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.COMMIT_REVEAL_MISMATCH)
        })

        it('wrong cycle', async () => {
          const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
          const votes = await getFormattedBallot(ballot)
          const commitHash = await getCommit(
            salt,
            initialCycle + 1,
            charlie.address,
            ballot
          )
          await CurrencyGovernance.connect(charlie).commit(commitHash)
          await time.increase(COMMIT_STAGE_LENGTH)

          await expect(
            CurrencyGovernance.reveal(charlie.address, salt, votes)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.COMMIT_REVEAL_MISMATCH)
        })

        it('wrong trustee', async () => {
          const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
          const votes = await getFormattedBallot(ballot)
          const commitHash = await getCommit(
            salt,
            initialCycle,
            bob.address,
            ballot
          )
          await CurrencyGovernance.connect(charlie).commit(commitHash)
          await time.increase(COMMIT_STAGE_LENGTH)

          await expect(
            CurrencyGovernance.reveal(charlie.address, salt, votes)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.COMMIT_REVEAL_MISMATCH)
        })

        it('wrong votes', async () => {
          const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
          const commitHash = await getCommit(
            salt,
            initialCycle,
            charlie.address,
            ballot
          )
          await CurrencyGovernance.connect(charlie).commit(commitHash)
          await time.increase(COMMIT_STAGE_LENGTH)

          const badVotes = await getFormattedBallot([
            charlieProposalId,
            bobProposalId,
            defaultProposalId,
          ])
          await expect(
            CurrencyGovernance.reveal(charlie.address, salt, badVotes)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.COMMIT_REVEAL_MISMATCH)
        })

        it('total garbage', async () => {
          const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
          const votes = await getFormattedBallot(ballot)
          const commitHash = ethers.utils.hexlify(ethers.utils.randomBytes(32))
          await CurrencyGovernance.connect(charlie).commit(commitHash)
          await time.increase(COMMIT_STAGE_LENGTH)

          await expect(
            CurrencyGovernance.reveal(charlie.address, salt, votes)
          ).to.be.revertedWith(ERRORS.CurrencyGovernance.COMMIT_REVEAL_MISMATCH)
        })
      })

      it('attempting to vote twice', async () => {
        const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
        const votes = await getFormattedBallot(ballot)
        const commitHash = await getCommit(
          salt,
          initialCycle,
          charlie.address,
          ballot
        )
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await time.increase(COMMIT_STAGE_LENGTH)

        await CurrencyGovernance.reveal(charlie.address, salt, votes)
        // commit mismatch on re-vote because the commit is deleted the first time
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.COMMIT_REVEAL_MISMATCH)
      })

      it('default proposal score underflow', async () => {
        const ballot = [charlieProposalId, bobProposalId, defaultProposalId]
        const votes = await getFormattedBallot(ballot)

        // this modification to the ballot looks close to correct, but it treats the default proposal as having one less support
        // this causes the revert to underflow and kills this ballot cheat
        votes.forEach((vote) => {
          vote.score -= 1
        })

        const commitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: charlie.address,
          votes,
        })
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_SCORE)
      })

      it('normal proposal score underflow', async () => {
        const ballot = [defaultProposalId, bobProposalId, charlieProposalId]
        const votes = await getFormattedBallot(ballot)

        // this modification to the ballot looks close to correct, but it treats the charlie proposal as having one less support
        // this causes the revert to underflow and kills this ballot cheat
        votes.forEach((vote) => {
          vote.score -= 1
        })

        const commitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: charlie.address,
          votes,
        })
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_SCORE)
      })

      it('bad proposalId in vote', async () => {
        // go to the next cycle's commit stage and commit a vote that's based on last cycle's votes
        const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
        const votes = await getFormattedBallot(ballot)
        const commitHash = await getCommit(
          salt,
          initialCycle + 1,
          charlie.address,
          ballot
        )
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await time.increase(CYCLE_LENGTH + COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_PROPOSALID_IN_VOTE)
      })

      it('non-proposalId in vote', async () => {
        // have one of the ballot items be a non-sense Id
        const badId = ethers.utils.hexlify(ethers.utils.randomBytes(32))
        const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
        const votes = await getFormattedBallot(ballot)
        votes[0].proposalId = badId
        const commitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: charlie.address,
          votes,
        })
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_PROPOSALID_IN_VOTE)
      })

      it('bad default vote sorting', async () => {
        const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
        const votes = await getFormattedBallot(ballot)
        votes.sort((a, b) => b.score - a.score)
        const commitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: charlie.address,
          votes,
        })
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_PROPOSALID_IN_VOTE)
        // we get this error instead of the ordering error because the default vote doesn't actually have the cycle param filled out
        // it uses it's special Id value to be processed correctly instead
      })

      it('bad vote sorting', async () => {
        const ballot = [defaultProposalId, charlieProposalId, bobProposalId]
        const votes = await getFormattedBallot(ballot)
        // the default vote is always first so we switch the 2nd and 3rd elements
        const temp = votes[1]
        votes[1] = votes[2]
        votes[2] = temp
        const commitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: charlie.address,
          votes,
        })
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.PROPOSALID_MISORDERED)
      })

      it('cheating with duplicates', async () => {
        // here we cheat by including bob multiple times
        const ballot = [
          defaultProposalId,
          charlieProposalId,
          bobProposalId,
          bobProposalId,
        ]
        const votes = await getFormattedBallot(ballot)
        // here we cheat in a slightly different way by doing bob then charlie then bob again
        // with the knowledge that bob's proposalId is the lower hex value
        expect(ethers.BigNumber.from(bobProposalId).lt(charlieProposalId)).to.be
          .true
        const sneakyVotes = votes.slice()
        sneakyVotes[2] = votes[3]
        sneakyVotes[3] = votes[2]
        const commitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: charlie.address,
          votes,
        })
        const sneakyCommitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: dave.address,
          votes: sneakyVotes,
        })
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await CurrencyGovernance.connect(dave).commit(sneakyCommitHash)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.PROPOSALID_MISORDERED)
        await expect(
          CurrencyGovernance.reveal(dave.address, salt, sneakyVotes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.PROPOSALID_MISORDERED)
      })

      it('cheating with duplicated scores', async () => {
        // here we cheat by setting the scores of votes to overlapping values
        const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
        const votes = await getFormattedBallot(ballot)
        votes[1].score = votes[0].score // sets the two scores to be equal
        // here we cheat in a slightly different way by doing bob then charlie then bob again
        // with the knowledge that bob's proposalId is the lower hex value
        const sneakyVotes = votes.slice()
        sneakyVotes[0].score = 3 // sets the default proposal to overlap with charlie's vote but not be the exact same value
        const commitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: charlie.address,
          votes,
        })
        const sneakyCommitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: dave.address,
          votes: sneakyVotes,
        })
        await CurrencyGovernance.connect(charlie).commit(commitHash)
        await CurrencyGovernance.connect(dave).commit(sneakyCommitHash)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_SCORE)
        await expect(
          CurrencyGovernance.reveal(dave.address, salt, sneakyVotes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_SCORE)
      })

      it('cheating with out of bound scores', async () => {
        // here we cheat by setting the scores to be out of bounds
        const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
        const votes = await getFormattedBallot(ballot)
        votes[1].score = 5
        votes[2].score = 20
        // here we only leave a small gap between the top two and bob's
        const sneakyVotes = votes.slice()
        sneakyVotes[2].score++
        sneakyVotes[0].score++
        // here we only leave a small gap at the bottom
        // this doesn't actually gain the attacker but is still disallowed
        const sneakyVotes2 = votes.slice()
        sneakyVotes2.forEach((v) => {
          v.score++
        })
        const commitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: bob.address,
          votes,
        })
        const sneakyCommitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: charlie.address,
          votes: sneakyVotes,
        })
        const sneakyCommitHash2 = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: dave.address,
          votes: sneakyVotes2,
        })
        await CurrencyGovernance.connect(bob).commit(commitHash)
        await CurrencyGovernance.connect(charlie).commit(sneakyCommitHash)
        await CurrencyGovernance.connect(dave).commit(sneakyCommitHash2)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.FINAL_SCORES_INVALID)
        await expect(
          CurrencyGovernance.reveal(dave.address, salt, sneakyVotes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.FINAL_SCORES_INVALID)
      })

      it('cheating with out of bound scores that would overflow the duplicateCompare var', async () => {
        // here we cheat by setting the scores to be out of bounds
        // without a check, this might work because it's overflowing
        const ballot = [charlieProposalId, defaultProposalId, bobProposalId]
        const votes = await getFormattedBallot(ballot)
        votes[2].score = 261
        // same deal but for the default proposal
        const defaultVotes = votes.slice()
        defaultVotes[0].score = 259
        const commitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: bob.address,
          votes,
        })
        const defaultCommitHash = hash({
          salt,
          cycle: initialCycle,
          submitterAddress: charlie.address,
          votes: defaultVotes,
        })
        await CurrencyGovernance.connect(bob).commit(commitHash)
        await CurrencyGovernance.connect(charlie).commit(defaultCommitHash)
        await time.increase(COMMIT_STAGE_LENGTH)
        await expect(
          CurrencyGovernance.reveal(bob.address, salt, votes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_SCORE)
        await expect(
          CurrencyGovernance.reveal(charlie.address, salt, defaultVotes)
        ).to.be.revertedWith(ERRORS.CurrencyGovernance.BAD_SCORE)
      })
    })
  })

  describe('enact stage', () => {
    const charlieProposalId = getProposalId(
      initialCycle,
      targets,
      functions,
      calldatas
    )
    const defaultProposalId = ethers.utils.hexZeroPad(
      ethers.BigNumber.from(initialCycle).toHexString(),
      32
    )
    const salt1 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
    const ballot1 = [charlieProposalId]
    const salt2 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
    const ballot2 = [defaultProposalId]

    let votes1: Vote[]
    let votes2: Vote[]

    beforeEach(async () => {
      await time.increaseTo(await CurrencyGovernance.governanceStartTime())
      await CurrencyGovernance.connect(charlie).propose(
        targets,
        functions,
        calldatas,
        description
      )

      await CurrencyGovernance.connect(dave).supportProposal(defaultProposalId)

      votes1 = await getFormattedBallot(ballot1)
      const commitHash1 = await getCommit(
        salt1,
        initialCycle,
        charlie.address,
        ballot1
      )
      votes2 = await getFormattedBallot(ballot2)
      const commitHash2 = await getCommit(
        salt2,
        initialCycle,
        dave.address,
        ballot2
      )

      await time.increase(PROPOSE_STAGE_LENGTH)

      // default will win if they both reveal
      await CurrencyGovernance.connect(charlie).commit(commitHash1)
      await CurrencyGovernance.connect(dave).commit(commitHash2)

      await time.increase(COMMIT_STAGE_LENGTH)

      await CurrencyGovernance.reveal(charlie.address, salt1, votes1)
    })

    describe('real proposal winning', () => {
      beforeEach(async () => {
        const leader = await CurrencyGovernance.leader()
        expect(leader).to.eq(charlieProposalId)
      })

      describe('happy path testing', () => {
        beforeEach(async () => {
          await time.increase(REVEAL_STAGE_LENGTH)
        })

        it('succeeds', async () => {
          await CurrencyGovernance.enact()
        })

        it('changes state correctly', async () => {
          const preEnacted = await Enacter.enacted()
          expect(preEnacted).to.be.false

          await CurrencyGovernance.enact()

          // dummy contract confirms call went through
          const enacted = await Enacter.enacted()
          expect(enacted).to.be.true

          // leader variable cleared
          const leader = await CurrencyGovernance.leader()
          expect(leader).to.eq(ethers.utils.hexZeroPad('0x', 32))

          // proposal still exists
          const charlieProposal = await CurrencyGovernance.proposals(
            charlieProposalId
          )
          expect(charlieProposal.cycle).to.eq(initialCycle)
          expect(charlieProposal.support.toNumber()).to.eq(1)
          expect(charlieProposal.description).to.eq(description)
          const charlieProposalTargets =
            await CurrencyGovernance.getProposalTargets(charlieProposalId)
          expect(charlieProposalTargets).to.eql(targets)
          const charlieProposalSignatures =
            await CurrencyGovernance.getProposalSignatures(charlieProposalId)
          expect(charlieProposalSignatures).to.eql(functions)
          const charlieProposalCalldatas =
            await CurrencyGovernance.getProposalCalldatas(charlieProposalId)
          expect(charlieProposalCalldatas).to.eql(calldatas)
        })

        it('passes data correctly', async () => {
          await expect(CurrencyGovernance.enact())
            .to.emit(Enacter, 'EnactionParameterCheck')
            .withArgs(charlieProposalId, targets, functions, calldatas)
        })

        it('emits result event', async () => {
          await expect(CurrencyGovernance.enact())
            .to.emit(CurrencyGovernance, 'VoteResult')
            .withArgs(initialCycle, charlieProposalId)
        })
      })

      describe('reverts', () => {
        it('cannot enact early', async () => {
          await expect(CurrencyGovernance.enact()).to.be.revertedWith(
            ERRORS.CurrencyGovernance.WRONG_STAGE
          )
        })
        it('cannot enact if participation is less than quorum', async () => {
          await time.increase(REVEAL_STAGE_LENGTH)
          const participation = await CurrencyGovernance.participation()
          await CurrencyGovernance.connect(policyImpersonator).setQuorum(
            participation.add(1)
          )
          await expect(CurrencyGovernance.enact()).to.be.revertedWith(
            ERRORS.CurrencyGovernance.QUORUM_NOT_MET
          )
        })
        it('does still enact if participation is less than quorum but equal to numTrustees', async () => {
          // this is solving the case where quorum is made more than the number of trustees
          await time.increase(REVEAL_STAGE_LENGTH)
          // participation is 1
          const participation = await CurrencyGovernance.participation()
          await CurrencyGovernance.connect(policyImpersonator).setQuorum(
            participation.add(1)
          )

          // remove all trustees except bob
          await TrustedNodes.connect(policyImpersonator).distrust(
            charlie.address
          )
          await TrustedNodes.connect(policyImpersonator).distrust(dave.address)
          await TrustedNodes.connect(policyImpersonator).distrust(niko.address)
          await TrustedNodes.connect(policyImpersonator).distrust(mila.address)

          await expect(CurrencyGovernance.enact()).to.emit(
            CurrencyGovernance,
            'VoteResult'
          )
        })

        it('cannot enact twice', async () => {
          await time.increase(REVEAL_STAGE_LENGTH)

          await CurrencyGovernance.enact()

          await expect(CurrencyGovernance.enact()).to.be.revertedWith(
            ERRORS.CurrencyGovernance.QUORUM_NOT_MET // participation is deleted so quorum check is what fails
          )
        })

        it('cannot enact late', async () => {
          await time.increase(REVEAL_STAGE_LENGTH + PROPOSE_STAGE_LENGTH)

          await expect(CurrencyGovernance.enact()).to.be.revertedWith(
            ERRORS.CurrencyGovernance.WRONG_STAGE
          )
        })

        it('cannot enact the next cycle either', async () => {
          await time.increase(REVEAL_STAGE_LENGTH + CYCLE_LENGTH)

          await expect(CurrencyGovernance.enact()).to.be.revertedWith(
            ERRORS.CurrencyGovernance.OUTDATED_ENACT
          )
        })
      })
    })

    describe('default proposal winning', () => {
      beforeEach(async () => {
        await CurrencyGovernance.reveal(dave.address, salt2, votes2)

        time.increase(REVEAL_STAGE_LENGTH)

        const leader = await CurrencyGovernance.leader()
        expect(leader).to.eq(defaultProposalId)
      })

      it('enact succeeds', async () => {
        await CurrencyGovernance.enact()
      })

      it('emits result event', async () => {
        await expect(CurrencyGovernance.enact())
          .to.emit(CurrencyGovernance, 'VoteResult')
          .withArgs(initialCycle, defaultProposalId)
      })

      it('changes state correctly', async () => {
        const preEnacted = await Enacter.enacted()
        expect(preEnacted).to.be.false

        await CurrencyGovernance.enact()

        // the enacter is never called, its state should not be changed
        const enacted = await Enacter.enacted()
        expect(enacted).to.be.false

        // leader variable cleared
        const leader = await CurrencyGovernance.leader()
        expect(leader).to.eq(ethers.utils.hexZeroPad('0x', 32))
      })
    })
  })
  describe('crossing between cycles', () => {
    const charlieProposalId = getProposalId(
      initialCycle,
      targets,
      functions,
      calldatas
    )
    const defaultProposalId = ethers.utils.hexZeroPad(
      ethers.BigNumber.from(initialCycle).toHexString(),
      32
    )
    const defaultProposalId2 = ethers.utils.hexZeroPad(
      ethers.BigNumber.from(initialCycle).add(1).toHexString(),
      32
    )
    const salt1 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
    const ballot1 = [charlieProposalId]
    const salt2 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
    const ballot2 = [defaultProposalId]
    const salt3 = ethers.utils.hexlify(ethers.utils.randomBytes(32))
    const ballot3 = [defaultProposalId2]

    let votes1: Vote[]
    let votes2: Vote[]
    let votes3: Vote[]

    beforeEach(async () => {
      await time.increaseTo(await CurrencyGovernance.governanceStartTime())

      await CurrencyGovernance.connect(charlie).propose(
        targets,
        functions,
        calldatas,
        description
      )

      await CurrencyGovernance.connect(dave).supportProposal(defaultProposalId)

      votes1 = await getFormattedBallot(ballot1)
      const commitHash1 = await getCommit(
        salt1,
        initialCycle,
        charlie.address,
        ballot1
      )
      votes2 = await getFormattedBallot(ballot2)
      const commitHash2 = await getCommit(
        salt2,
        initialCycle,
        dave.address,
        ballot2
      )

      await time.increase(PROPOSE_STAGE_LENGTH)

      // default will win if they both reveal
      await CurrencyGovernance.connect(charlie).commit(commitHash1)
      await CurrencyGovernance.connect(dave).commit(commitHash2)

      await time.increase(COMMIT_STAGE_LENGTH)

      await CurrencyGovernance.reveal(charlie.address, salt1, votes1)
      await CurrencyGovernance.reveal(dave.address, salt2, votes2)
    })
    it('resets participation to 0 upon commit', async () => {
      const initialParticipation = await CurrencyGovernance.participation()

      await time.increase(REVEAL_STAGE_LENGTH)

      await time.increase(PROPOSE_STAGE_LENGTH)
      expect(Number(initialParticipation)).to.be.greaterThan(0)

      votes3 = await getFormattedBallot(ballot3)
      const commitHash3 = await getCommit(
        salt3,
        initialCycle + 1,
        dave.address,
        ballot3
      )

      await CurrencyGovernance.connect(dave).commit(commitHash3)

      await time.increase(COMMIT_STAGE_LENGTH)

      await CurrencyGovernance.reveal(dave.address, salt3, votes3)

      expect(await CurrencyGovernance.participation()).to.eq(1) // dave has voted again and 2 is reset to 1
    })
    it('resets leader to 0 upon commit', async () => {
      const initialParticipation = await CurrencyGovernance.participation()

      await time.increase(REVEAL_STAGE_LENGTH)
      await time.increase(PROPOSE_STAGE_LENGTH)
      expect(Number(initialParticipation)).to.be.greaterThan(0)

      votes3 = await getFormattedBallot(ballot3)
      const commitHash3 = await getCommit(
        salt3,
        initialCycle + 1,
        dave.address,
        ballot3
      )

      await CurrencyGovernance.connect(dave).commit(commitHash3)

      await time.increase(COMMIT_STAGE_LENGTH)

      await CurrencyGovernance.reveal(dave.address, salt3, votes3)

      expect(await CurrencyGovernance.leader()).to.eq(
        ethers.utils.hexZeroPad(`0x${(initialCycle + 1).toString(16)}`, 32) // leader is now the next cycle's default
      )
    })
    it('cannot unsupport old cycle', async () => {
      /************************************************************************
                         Step 0: Setup
   
      Advance to the proposal stage of the second cycle. Charlie proposes 
      something (same one as before, but in a new cycle). 
      *************************************************************************/
      await time.increase(REVEAL_STAGE_LENGTH)
      const stageInfo = await CurrencyGovernance.getCurrentStage()
      const currentCycle = initialCycle + 1
      expect(stageInfo.currentCycle).to.eq(currentCycle)
      expect(stageInfo.currentStage).to.equal(PROPOSE_STAGE)

      const charlieProposalId = getProposalId(
        currentCycle,
        targets,
        functions,
        calldatas
      )

      await CurrencyGovernance.connect(charlie).propose(
        targets,
        functions,
        calldatas,
        description
      )

      /************************************************************************
                           Step 1: Show Exploit Is Not Possible
    
      Dave can try to unsupport an old proposal he supported (`defaultProposalId`) since 
      it would reset his `trusteeSupports` mapping. He is not allowed to do this as it 
      would allow him to support multiple times in a cycle. 
      *************************************************************************/
      expect(
        (await CurrencyGovernance.proposals(charlieProposalId)).support
      ).to.eq(1)

      await CurrencyGovernance.connect(dave).supportProposal(charlieProposalId)
      expect(
        (await CurrencyGovernance.proposals(charlieProposalId)).support
      ).to.eq(2)
      await expect(
        CurrencyGovernance.connect(dave).unsupportProposal(defaultProposalId)
      ).to.be.revertedWith(ERRORS.CurrencyGovernance.UNSUPPORT_ON_PAST_PROPOSAL)

      // this exploitative code cannot be reached
      // await CurrencyGovernance.connect(dave).supportProposal(charlieProposalId)
      // const proposalAfter = await CurrencyGovernance.proposals(charlieProposalId)
      // expect(proposalAfter.support.toNumber()).to.eq(3)

      expect(
        (await CurrencyGovernance.proposals(charlieProposalId)).support
      ).to.eq(2)
    })
  })
})
