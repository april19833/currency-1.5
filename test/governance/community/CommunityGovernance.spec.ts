import { ethers } from 'hardhat'
import { expect, use } from 'chai'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { ERRORS } from '../../utils/errors'
import { deploy } from '../../../deploy/utils'
import {
  CommunityGovernance,
  CommunityGovernance__factory,
  Policy,
  ECO,
  ECO__factory,
  ECOxStaking,
  ECOxStaking__factory,
  SampleProposal,
  SampleProposal__factory,
} from '../../../typechain-types'

use(smock.matchers)

const A1 = '0x1111111111111111111111111111111111111111'
const A2 = '0x2222222222222222222222222222222222222222'
const INITIAL_SUPPLY = ethers.utils.parseEther('100')
const INIT_BALANCE = 20000
const INIT_BIG_BALANCE = 100000

// Stage enums
const DONE = 0
const PROPOSAL = 1
const VOTING = 2
const DELAY = 3
const EXECUTION = 4

// Vote enums
const REJECT = 0
const ENACT = 1
const ABSTAIN = 2

describe('Community Governance', () => {
  let policyImpersonator: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress
  let bigboy: SignerWithAddress
  before(async () => {
    ;[policyImpersonator, alice, bob, charlie, bigboy] =
      await ethers.getSigners()
  })
  let policy: FakeContract<Policy>
  let eco: MockContract<ECO>
  let ecoXStaking: MockContract<ECOxStaking>
  let realProp: SampleProposal
  let currentStageEnd: Number

  let cg: MockContract<CommunityGovernance>

  beforeEach(async () => {
    policy = await smock.fake<Policy>(
      'Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )

    eco = await (
      await smock.mock<ECO__factory>('ECO')
    ).deploy(
      policy.address,
      alice.address // pauser
    )
    await eco.connect(policyImpersonator).updateMinters(policy.address, true)
    await eco.connect(alice).enableVoting()
    await eco.connect(policyImpersonator).mint(alice.address, INIT_BALANCE)
    await eco.connect(bob).enableVoting()
    await eco.connect(policyImpersonator).mint(bob.address, INIT_BALANCE)
    await eco.connect(charlie).enableVoting()
    await eco.connect(policyImpersonator).mint(charlie.address, INIT_BALANCE)
    await eco.connect(bigboy).enableVoting()
    await eco.connect(policyImpersonator).mint(bigboy.address, INIT_BIG_BALANCE)

    ecoXStaking = await (
      await smock.mock<ECOxStaking__factory>('ECOxStaking')
    ).deploy(
      policy.address,
      A2 // ECOx
    )

    currentStageEnd = await time.latest()

    cg = await (
      await smock.mock<CommunityGovernance__factory>('CommunityGovernance')
    ).deploy(
      policy.address,
      eco.address,
      ecoXStaking.address,
      currentStageEnd,
      alice.address // pauser
    )

    await eco.connect(policyImpersonator).updateSnapshotters(cg.address, true)
  })
  describe('constructor', () => {
    it('Constructs', async () => {
      expect(await cg.policy()).to.eq(policy.address)
      expect(await cg.ecoToken()).to.eq(eco.address)
      expect(await cg.ecoXStaking()).to.eq(ecoXStaking.address)
      expect(await cg.pauser()).to.eq(alice.address)
    })

    it('has correct values for cycleCount, cycleStart, stage, currentStageEnd', async () => {
      expect(await cg.cycleCount()).to.eq(1000)
      expect(await cg.cycleStart()).to.eq(0)
      expect(await cg.currentStageEnd()).to.eq(currentStageEnd)
      expect(await cg.stage()).to.eq(DONE)
    })
    it('bricks when eco or ecoxstaking is 0 address', async () => {
      const cgmocker = await smock.mock<CommunityGovernance__factory>(
        'CommunityGovernance'
      )
      await expect(
        cgmocker.deploy(
          policy.address,
          ethers.constants.AddressZero,
          ecoXStaking.address,
          currentStageEnd,
          alice.address
        )
      ).to.be.revertedWith(ERRORS.Policed.NON_ZERO_CONTRACT_ADDRESS)
      await expect(
        cgmocker.deploy(
          policy.address,
          eco.address,
          ethers.constants.AddressZero,
          currentStageEnd,
          alice.address
        )
      ).to.be.revertedWith(ERRORS.Policed.NON_ZERO_CONTRACT_ADDRESS)
    })
  })
  describe('permissions', () => {
    it('only lets Policy set pauser', async () => {
      expect(await cg.pauser()).to.eq(alice.address)
      await expect(cg.connect(alice).setPauser(bob.address)).to.be.revertedWith(
        ERRORS.Policed.POLICY_ONLY
      )
      expect(await cg.pauser()).to.eq(alice.address)
      await expect(
        cg.connect(policyImpersonator).setPauser(policyImpersonator.address)
      )
        .to.emit(cg, 'PauserAssignment')
        .withArgs(policyImpersonator.address)
      expect(await cg.pauser()).to.eq(policyImpersonator.address)
    })
    it('only lets pauser pause', async () => {
      expect(await cg.paused()).to.be.false

      await expect(cg.pause()).to.be.revertedWith(
        ERRORS.COMMUNITYGOVERNANCE.ONLY_PAUSER
      )
      expect(await cg.paused()).to.be.false

      await cg.connect(alice).pause()
      expect(await cg.paused()).to.be.true
    })
    it('only lets policy sweep', async () => {
      await eco.connect(alice).transfer(cg.address, 20000)
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(cg.address)).to.eq(20000)

      await cg.setVariable('pot', 1234)

      await expect(cg.connect(alice).sweep(alice.address)).to.be.revertedWith(
        ERRORS.Policed.POLICY_ONLY
      )

      await expect(cg.connect(policyImpersonator).sweep(alice.address))
        .to.emit(cg, 'Sweep')
        .withArgs(alice.address)

      expect(await eco.balanceOf(alice.address)).to.eq(1234)
      expect(await eco.balanceOf(cg.address)).to.eq(20000 - 1234)
      expect(await cg.pot()).to.eq(0)
    })
  })

  describe('updateStage', () => {
    it('works fine right after deployment with cycleStart = 0, moves from done to proposal', async () => {
      expect(await cg.stage()).to.eq(DONE)
      await expect(cg.updateStage())
        .to.emit(cg, 'NewCycle')
        .withArgs(1001)
        .to.emit(cg, 'StageUpdated')
        .withArgs(PROPOSAL)
      expect(await cg.cycleStart()).to.eq(await time.latest())
      expect(await cg.currentStageEnd()).to.eq(
        (await cg.PROPOSAL_LENGTH()).add(await cg.cycleStart())
      )
      expect(await cg.stage()).to.eq(PROPOSAL)
    })
    it('updates to done from proposal stage', async () => {
      await cg.updateStage()
      await time.increaseTo(await cg.currentStageEnd())
      // no proposal selected by end of proposal stage
      await expect(cg.updateStage()).to.emit(cg, 'StageUpdated').withArgs(DONE)

      expect(await cg.stage()).to.eq(DONE)
      expect(await cg.currentStageEnd()).to.eq(
        (await cg.cycleStart()).add(await cg.CYCLE_LENGTH())
      )
    })
    it('updates to delay from voting if there are more enact votes than reject', async () => {
      // manually get to voting stage
      await cg.updateStage()

      await eco.connect(alice).approve(cg.address, await cg.proposalFee())
      await cg.connect(alice).propose(A1)
      await cg.connect(bigboy).support(A1)

      expect(await cg.stage()).to.eq(VOTING)

      await cg.setVariable('totalEnactVotes', 10)
      await cg.setVariable('totalRejectVotes', 9)
      // abstain votes dont matter but lets prove it
      await cg.setVariable('totalAbstainVotes', 100)

      await time.increaseTo(await cg.currentStageEnd())
      await expect(cg.updateStage()).to.emit(cg, 'StageUpdated').withArgs(DELAY)

      expect(await cg.stage()).to.eq(DELAY)
      expect(await cg.currentStageEnd()).to.eq(
        (await cg.DELAY_LENGTH()).add(await time.latest())
      )
    })
    it('updates to done from voting if there are fewer enact votes than reject', async () => {
      // manually get to voting stage
      await cg.updateStage()

      await eco.connect(alice).approve(cg.address, await cg.proposalFee())
      await cg.connect(alice).propose(A1)
      await cg.connect(bigboy).support(A1)

      expect(await cg.stage()).to.eq(VOTING)

      await cg.setVariable('totalEnactVotes', 9)
      await cg.setVariable('totalRejectVotes', 10)
      // abstain votes dont matter but lets prove it
      await cg.setVariable('totalAbstainVotes', 0)

      await time.increaseTo(await cg.currentStageEnd())
      await expect(cg.updateStage()).to.emit(cg, 'StageUpdated').withArgs(DONE)

      expect(await cg.stage()).to.eq(DONE)
      expect(await cg.currentStageEnd()).to.eq(
        (await cg.cycleStart()).add(await cg.CYCLE_LENGTH())
      )
    })
    it('updates stage to execution from delay', async () => {
      // manually get to DELAY stage
      await cg.updateStage()

      await eco.connect(alice).approve(cg.address, await cg.proposalFee())
      await cg.connect(alice).propose(A1)
      await cg.connect(bigboy).support(A1)

      await cg.connect(alice).vote(ENACT)
      await time.increaseTo(await cg.currentStageEnd())
      await cg.updateStage()

      expect(await cg.stage()).to.eq(DELAY)

      await time.increaseTo(await cg.currentStageEnd())
      await expect(cg.updateStage())
        .to.emit(cg, 'StageUpdated')
        .withArgs(EXECUTION)

      expect(await cg.stage()).to.eq(EXECUTION)
      expect(await cg.currentStageEnd()).to.eq(
        (await cg.cycleStart()).add(await cg.CYCLE_LENGTH())
      )
    })
    it('starts a new cycle if updateStage is called at the end of execution', async () => {
      // manually get to EXECUTION stage
      await cg.updateStage()
      await eco.connect(alice).approve(cg.address, await cg.proposalFee())
      await cg.connect(alice).propose(A1)
      await cg.connect(bigboy).support(A1)

      await cg.connect(bigboy).vote(ENACT)

      expect(await cg.stage()).to.eq(EXECUTION)

      const cycle = await cg.cycleCount()

      await time.increaseTo(await cg.currentStageEnd())
      await expect(cg.updateStage())
        .to.emit(cg, 'StageUpdated')
        .withArgs(PROPOSAL)
        .to.emit(cg, 'NewCycle')
        .withArgs(await cg.cycleCount())

      expect(await cg.stage()).to.eq(PROPOSAL)
      expect(await cg.currentStageEnd()).to.eq(
        (await cg.cycleStart()).add(await cg.PROPOSAL_LENGTH())
      )
      expect(await cg.cycleCount()).to.eq(cycle.add(1))
    })
    context('newCycle', () => {
      it('resets everything', async () => {
        // manually get to DONE stage
        await cg.updateStage()
        await eco.connect(alice).approve(cg.address, await cg.proposalFee())

        const realProp = await deploy(alice, SampleProposal__factory, [])

        await cg.connect(alice).propose(realProp.address)
        await cg.connect(bigboy).support(realProp.address)

        await cg.connect(bigboy).vote(ENACT)

        await cg.connect(bigboy).execute()
        expect(await cg.stage()).to.eq(DONE)

        await cg.setVariable('totalRejectVotes', 12)
        await cg.setVariable('totalAbstainVotes', 12)

        expect(await cg.selectedProposal()).to.not.eq(
          ethers.constants.AddressZero
        )
        expect(await cg.totalEnactVotes()).to.not.eq(0)
        expect(await cg.totalRejectVotes()).to.not.eq(0)
        expect(await cg.totalAbstainVotes()).to.not.eq(0)

        await time.increaseTo(await cg.currentStageEnd())
        await cg.updateStage()

        expect(await cg.selectedProposal()).to.eq(ethers.constants.AddressZero)
        expect(await cg.totalEnactVotes()).to.eq(0)
        expect(await cg.totalRejectVotes()).to.eq(0)
        expect(await cg.totalAbstainVotes()).to.eq(0)
      })
    })
  })

  context('proposal stage', () => {
    describe('proposing', () => {
      it('fails if called during not-proposal stage', async () => {
        await cg.setVariable('currentStageEnd', (await time.latest()) + 100)
        expect(await cg.stage()).to.not.eq(PROPOSAL)

        await expect(cg.connect(alice).propose(A1)).to.be.revertedWith(
          ERRORS.COMMUNITYGOVERNANCE.WRONG_STAGE
        )
      })
      it('registers a proposal and its data correctly', async () => {
        await eco.connect(alice).approve(cg.address, await cg.proposalFee())
        await expect(cg.connect(alice).propose(A1))
          .to.emit(cg, 'ProposalRegistration')
          .withArgs(alice.address, A1)
        expect((await cg.proposals(A1)).cycle).to.eq(await cg.cycleCount())
        expect((await cg.proposals(A1)).proposer).to.eq(alice.address)
        expect((await cg.proposals(A1)).totalSupport).to.eq(0)
        expect((await cg.proposals(A1)).refund).to.eq(await cg.feeRefund())
        expect(await cg.pot()).to.eq(
          (await cg.proposalFee()) - (await cg.proposals(A1)).refund
        )
        expect(await eco.balanceOf(alice.address)).to.eq(
          INIT_BALANCE - (await cg.proposalFee())
        )
      })
      it('doesnt allow submitting duplicate proposals', async () => {
        await eco.connect(alice).approve(cg.address, await cg.proposalFee())
        await cg.connect(alice).propose(A1)

        await eco.connect(bob).approve(cg.address, await cg.proposalFee())
        await expect(cg.connect(bob).propose(A1)).to.be.revertedWith(
          ERRORS.COMMUNITYGOVERNANCE.DUPLICATE_PROPOSAL
        )
      })
      it('allows the same address to submit multiple proposals in a cycle', async () => {
        await eco
          .connect(alice)
          .approve(cg.address, (await cg.proposalFee()).mul(2))
        await cg.connect(alice).propose(A1)
        await cg.connect(alice).propose(A2)
      })
      it('still allows for proposal when eco and cg are paused', async () => {
        await eco.connect(alice).pause()
        expect(await eco.paused()).to.be.true

        await expect(eco.connect(alice).transfer(bob.address, 10)).to.be
          .reverted

        await cg.connect(alice).pause()
        await cg.connect(alice).propose(A1)

        expect((await cg.proposals(A1)).refund).to.eq(0)
      })
    })
    describe('supporting', () => {
      beforeEach(async () => {
        await eco.connect(alice).approve(cg.address, await cg.proposalFee())
        await eco.connect(bob).approve(cg.address, await cg.proposalFee())
        await cg.connect(alice).propose(A1)
        await cg.connect(bob).propose(A2)
      })
      context('support', () => {
        it('performs a single support correctly', async () => {
          const vp = await cg.votingPower(
            alice.address,
            await cg.snapshotBlock()
          )
          await expect(cg.connect(alice).support(A1))
            .to.emit(cg, 'SupportChanged')
            .withArgs(alice.address, A1, 0, vp)

          expect(await cg.getSupport(alice.address, A1)).to.eq(vp)
          expect((await cg.proposals(A1)).totalSupport).to.eq(vp)
        })
        it('allows one address to support multiple proposals', async () => {
          const vp = await cg.votingPower(
            alice.address,
            await cg.snapshotBlock()
          )
          await cg.connect(alice).support(A1)
          await cg.connect(alice).support(A2)
          expect((await cg.proposals(A1)).totalSupport).to.eq(vp)
          expect((await cg.proposals(A2)).totalSupport).to.eq(vp)
        })
        it('does not change state when an address re-supports the same proposal again', async () => {
          const vp = await cg.votingPower(
            alice.address,
            await cg.snapshotBlock()
          )
          await cg.connect(alice).support(A1)
          expect(await cg.getSupport(alice.address, A1)).to.eq(vp)
          expect((await cg.proposals(A1)).totalSupport).to.eq(vp)
          await cg.connect(alice).support(A1)
          expect(await cg.getSupport(alice.address, A1)).to.eq(vp)
          expect((await cg.proposals(A1)).totalSupport).to.eq(vp)
        })
      })
      context('supportPartial', () => {
        it('fails if proposal and allocation arrays are different lengths', async () => {
          const proposals = [A1, A2]
          const allocations = [1]
          await expect(
            cg.supportPartial(proposals, allocations)
          ).to.be.revertedWith(ERRORS.COMMUNITYGOVERNANCE.ARRAY_LENGTH_MISMATCH)
        })
        it('fails if support allocations are greater than senders vp', async () => {
          const vp = await cg.votingPower(
            alice.address,
            await cg.snapshotBlock()
          )
          const proposals = [A1, A2]
          const allocations = [vp.mul(2), vp.mul(2).add(1)]
          await expect(
            cg.supportPartial(proposals, allocations)
          ).to.be.revertedWith(ERRORS.COMMUNITYGOVERNANCE.BAD_VOTING_POWER)
        })
        it('works if sum > senders vp', async () => {
          const vp = await cg.votingPower(
            alice.address,
            await cg.snapshotBlock()
          )
          const proposals = [A1, A2]
          const vp1 = vp.div(2).add(1)
          const vp2 = vp.div(2).add(1)
          const allocations = [vp1, vp2]

          await expect(cg.connect(alice).supportPartial(proposals, allocations))
            .to.emit(cg, 'SupportChanged')
            .withArgs(alice.address, A1, 0, vp1)
            .to.emit(cg, 'SupportChanged')
            .withArgs(alice.address, A2, 0, vp2)

          expect(await cg.getSupport(alice.address, A1)).to.eq(vp1)
          expect((await cg.proposals(A1)).totalSupport).to.eq(vp1)
          expect(await cg.getSupport(alice.address, A2)).to.eq(vp2)
          expect((await cg.proposals(A2)).totalSupport).to.eq(vp2)
        })
        it('overwrites previous supports as expected', async () => {
          const vp = await cg.votingPower(
            alice.address,
            await cg.snapshotBlock()
          )
          const proposals = [A1, A2]
          const vp1 = vp.div(2).sub(1)
          const vp2 = vp.div(2).add(1)
          let allocations = [vp1, vp2]

          await cg.connect(alice).supportPartial(proposals, allocations)

          allocations = [vp2, vp1]
          await cg.connect(alice).supportPartial(proposals, allocations)

          expect(await cg.getSupport(alice.address, A1)).to.eq(vp2)
          expect((await cg.proposals(A1)).totalSupport).to.eq(vp2)
          expect(await cg.getSupport(alice.address, A2)).to.eq(vp1)
          expect((await cg.proposals(A2)).totalSupport).to.eq(vp1)
        })
        it('handles double supporting well in the same supportPartial', async () => {
          const vp = await cg.votingPower(
            alice.address,
            await cg.snapshotBlock()
          )
          const proposals = [A1, A2, A1, A1]
          const vp1 = vp.div(2).sub(1)
          const vp2 = vp.div(2).add(1)
          const allocations = [vp1, vp2, vp1, vp2]

          await cg.connect(alice).supportPartial(proposals, allocations)

          expect(await cg.getSupport(alice.address, A1)).to.eq(vp2)
          expect((await cg.proposals(A1)).totalSupport).to.eq(vp2)
          expect(await cg.getSupport(alice.address, A2)).to.eq(vp2)
          expect((await cg.proposals(A2)).totalSupport).to.eq(vp2)
        })
      })
      context('unsupporting', () => {
        it('fails if no support to begin with', async () => {
          expect(await cg.getSupport(charlie.address, A1)).to.eq(0)

          await expect(cg.connect(charlie).unsupport(A1)).to.be.revertedWith(
            ERRORS.COMMUNITYGOVERNANCE.NO_SUPPORT_TO_REVOKE
          )
        })
        it('revokes support if there is any, and removes it from the supporting VP', async () => {
          await cg.connect(alice).support(A1)
          await cg.connect(bob).supportPartial([A1, A2], [15, 20])

          expect(await cg.getSupport(alice.address, A1)).to.eq(INIT_BALANCE)
          expect(await cg.getSupport(bob.address, A1)).to.eq(15)
          expect(await cg.getSupport(bob.address, A2)).to.eq(20)

          expect((await cg.proposals(A1)).totalSupport).to.eq(INIT_BALANCE + 15)
          expect((await cg.proposals(A2)).totalSupport).to.eq(20)

          await expect(cg.connect(bob).unsupport(A1))
            .to.emit(cg, 'SupportChanged')
            .withArgs(bob.address, A1, 15, 0)

          expect(await cg.getSupport(alice.address, A1)).to.eq(INIT_BALANCE)
          expect(await cg.getSupport(bob.address, A1)).to.eq(0)
          expect(await cg.getSupport(bob.address, A2)).to.eq(20)

          expect((await cg.proposals(A1)).totalSupport).to.eq(INIT_BALANCE)
          expect((await cg.proposals(A2)).totalSupport).to.eq(20)
        })
      })
      it('fails to support if called during not-proposal stage', async () => {
        await cg.setVariable('currentStageEnd', (await time.latest()) - 100)
        await cg.updateStage()

        expect(await cg.stage()).to.not.eq(PROPOSAL)

        await expect(cg.connect(alice).support(A1)).to.be.revertedWith(
          ERRORS.COMMUNITYGOVERNANCE.WRONG_STAGE
        )
        await expect(
          cg.connect(alice).supportPartial([A1], [123])
        ).to.be.revertedWith(ERRORS.COMMUNITYGOVERNANCE.WRONG_STAGE)
      })
      it('moves to vote stage if support is above threshold', async () => {
        expect(await cg.stage()).to.eq(PROPOSAL)
        const initialPot = await cg.pot()
        const initialRefund = (await cg.proposals(A1)).refund

        await cg.connect(alice).support(A1)
        expect(await cg.stage()).to.eq(PROPOSAL)

        await expect(cg.connect(bigboy).support(A2))
          .to.emit(cg, 'StageUpdated')
          .withArgs(VOTING)
        expect(await cg.stage()).to.eq(VOTING)
        expect(await cg.currentStageEnd()).to.eq(
          (await cg.VOTING_LENGTH()).add(await time.latest())
        )
        expect(await cg.selectedProposal()).to.eq(A2)

        expect((await cg.proposals(await cg.selectedProposal())).refund).to.eq(
          await cg.proposalFee()
        )
        expect(await cg.pot()).to.eq(
          initialPot - ((await cg.proposalFee()) - initialRefund)
        )
      })
    })
  })

  describe('voting stage', () => {
    beforeEach(async () => {
      await eco.connect(alice).approve(cg.address, await cg.proposalFee())
      await cg.connect(alice).propose(A1)
      await cg.connect(bigboy).support(A1)
    })
    context('vote', () => {
      it('votes correctly', async () => {
        const vp = await cg.votingPower(alice.address, await cg.snapshotBlock())

        const votes = await cg.getVotes(alice.address)
        expect(votes.enactVotes).to.eq(0)
        expect(votes.rejectVotes).to.eq(0)
        expect(votes.abstainVotes).to.eq(0)

        expect(await cg.totalEnactVotes()).to.eq(0)

        await expect(cg.connect(alice).vote(ENACT))
          .to.emit(cg, 'VotesChanged')
          .withArgs(alice.address, vp, 0, 0)

        const votesNow = await cg.getVotes(alice.address)
        expect(votesNow.enactVotes).to.eq(vp)
        expect(votesNow.rejectVotes).to.eq(0)
        expect(votesNow.abstainVotes).to.eq(0)

        expect(await cg.totalEnactVotes()).to.eq(vp)
      })

      it('votes again correctly', async () => {
        const vp = await cg.votingPower(alice.address, await cg.snapshotBlock())
        await cg.connect(alice).vote(ABSTAIN)

        const votes = await cg.getVotes(alice.address)
        expect(votes.enactVotes).to.eq(0)
        expect(votes.rejectVotes).to.eq(0)
        expect(votes.abstainVotes).to.eq(vp)

        expect(await cg.totalAbstainVotes()).to.eq(vp)
        expect(await cg.totalRejectVotes()).to.eq(0)

        await expect(cg.connect(alice).vote(REJECT))
          .to.emit(cg, 'VotesChanged')
          .withArgs(alice.address, 0, vp, 0)

        const votesNow = await cg.getVotes(alice.address)
        expect(votesNow.enactVotes).to.eq(0)
        expect(votesNow.rejectVotes).to.eq(vp)
        expect(votesNow.abstainVotes).to.eq(0)

        expect(await cg.totalAbstainVotes()).to.eq(0)
        expect(await cg.totalRejectVotes()).to.eq(vp)
      })
    })
    context('votePartial', () => {
      it('fails if sum of allocations > voting power', async () => {
        const vp = await cg.votingPower(alice.address, await cg.snapshotBlock())
        const enactVotes = vp / 2
        const rejectVotes = vp / 2
        const abstainVotes = 1
        await expect(
          cg.votePartial(enactVotes, rejectVotes, abstainVotes)
        ).to.be.revertedWith(ERRORS.COMMUNITYGOVERNANCE.BAD_VOTING_POWER)
      })
      it('suceeds if allocations total to less than senders voting power', async () => {
        const vp = await cg.votingPower(alice.address, await cg.snapshotBlock())
        const votes1 = vp / 4
        const votes2 = vp / 2
        const votes3 = vp / 4

        await expect(cg.connect(alice).votePartial(votes1, votes2, votes3))
          .to.emit(cg, 'VotesChanged')
          .withArgs(alice.address, votes1, votes2, votes3)

        const votes = await cg.getVotes(alice.address)
        expect(votes.enactVotes).to.eq(votes1)
        expect(votes.rejectVotes).to.eq(votes2)
        expect(votes.abstainVotes).to.eq(votes3)

        expect(await cg.totalEnactVotes()).to.eq(votes1)
        expect(await cg.totalRejectVotes()).to.eq(votes2)
        expect(await cg.totalAbstainVotes()).to.eq(votes3)
      })
      it('overwrites votes properly when voting a second time in same cycle', async () => {
        const vp = await cg.votingPower(alice.address, await cg.snapshotBlock())
        const votes1 = vp / 5
        const votes2 = vp / 10
        const votes3 = vp / 20

        await cg.connect(alice).votePartial(votes1, votes2, votes3)
        let votes = await cg.getVotes(alice.address)

        expect(votes.enactVotes).to.eq(votes1)
        expect(votes.rejectVotes).to.eq(votes2)
        expect(votes.abstainVotes).to.eq(votes3)
        expect(await cg.totalEnactVotes()).to.eq(votes1)
        expect(await cg.totalRejectVotes()).to.eq(votes2)
        expect(await cg.totalAbstainVotes()).to.eq(votes3)

        await cg.connect(alice).votePartial(votes2, votes3, votes1)
        votes = await cg.getVotes(alice.address)

        expect(votes.enactVotes).to.eq(votes2)
        expect(votes.rejectVotes).to.eq(votes3)
        expect(votes.abstainVotes).to.eq(votes1)
        expect(await cg.totalEnactVotes()).to.eq(votes2)
        expect(await cg.totalRejectVotes()).to.eq(votes3)
        expect(await cg.totalAbstainVotes()).to.eq(votes1)
      })
    })
    it('doesnt allow voting in not voting stage', async () => {
      await cg.setVariable('currentStageEnd', (await time.latest()) - 100)
      await cg.updateStage()

      expect(await cg.stage()).to.not.eq(VOTING)

      await expect(cg.connect(alice).vote(ENACT)).to.be.revertedWith(
        ERRORS.COMMUNITYGOVERNANCE.WRONG_STAGE
      )
    })
    it('pushes to execute stage if there are more than voteThreshold enacting votes', async () => {
      await expect(cg.connect(bigboy).vote(ENACT))
        .to.emit(cg, 'StageUpdated')
        .withArgs(EXECUTION)

      expect(await cg.currentStageEnd()).to.be.closeTo(
        (await cg.CYCLE_LENGTH()).add(await time.latest()),
        10
      )
      expect(await cg.stage()).to.eq(EXECUTION)
    })
  })

  describe('execution stage', () => {
    beforeEach(async () => {
      realProp = await deploy(alice, SampleProposal__factory, [])
      await eco.connect(alice).approve(cg.address, await cg.proposalFee())
      await cg.connect(alice).propose(realProp.address)
      await cg.connect(bigboy).support(realProp.address)
      await cg.connect(bigboy).vote(ENACT)
    })
    it('fails to execute during not execution stage', async () => {
      await cg.setVariable('currentStageEnd', (await time.latest()) - 100)
      await cg.updateStage()

      expect(await cg.stage()).to.not.eq(EXECUTION)

      await expect(cg.execute()).to.be.revertedWith(
        ERRORS.COMMUNITYGOVERNANCE.WRONG_STAGE
      )
    })
    it('executes properly', async () => {
      expect(await cg.stage()).to.eq(EXECUTION)
      expect(policy.enact).to.have.not.been.called

      await cg.execute()

      expect(await cg.stage()).to.eq(DONE)
      expect(policy.enact).to.have.been.calledOnce
    })
    it('does not allow repeat execution', async () => {
      await cg.execute()
      await expect(cg.execute()).to.be.revertedWith(
        ERRORS.COMMUNITYGOVERNANCE.WRONG_STAGE
      )
    })
  })
  describe('refund', () => {
    beforeEach(async () => {
      await eco.connect(alice).approve(cg.address, await cg.proposalFee())
      await cg.connect(alice).propose(A1)
      await eco.connect(bob).approve(cg.address, await cg.proposalFee())
      await cg.connect(bob).propose(A2)
      await cg.connect(bigboy).support(A1)
    })
    it('doesnt allow refund during same cycle', async () => {
      await expect(cg.connect(bob).refund(A2)).to.be.revertedWith(
        ERRORS.COMMUNITYGOVERNANCE.NO_REFUND_DURING_CYCLE
      )
    })
    it('refunds properly in later cycle', async () => {
      await cg.setVariable('cycleCount', (await cg.cycleCount()).add(1))
      const propRefund = (await cg.proposals(A2)).refund

      await expect(cg.connect(bob).refund(A2))
        .to.emit(cg, 'FeeRefunded')
        .withArgs(A2, bob.address, propRefund)

      const newRefund = (await cg.proposals(A2)).refund
      expect(newRefund).to.eq(0)
    })
  })
  it('E2E', async () => {
    realProp = await deploy(alice, SampleProposal__factory, [])
    await eco.connect(alice).approve(cg.address, await cg.proposalFee())
    await cg.connect(alice).propose(realProp.address)
    await eco.connect(bob).approve(cg.address, await cg.proposalFee())
    await cg.connect(bob).propose(A1)

    const currCycle = await cg.cycleCount()

    const vp = await cg.votingPower(alice.address, await cg.snapshotBlock())

    await cg
      .connect(bob)
      .supportPartial([realProp.address, A1], [5, vp.div(3).mul(2)])
    await cg.connect(bob).unsupport(A1)
    expect(await cg.getSupport(bob.address, A1)).to.eq(0)
    await cg.connect(bigboy).support(realProp.address)
    await expect(cg.connect(charlie).support(A1)).to.be.revertedWith(
      ERRORS.COMMUNITYGOVERNANCE.WRONG_STAGE
    )
    await cg.connect(bob).vote(REJECT)
    await cg.connect(alice).votePartial(2, 3, 500)
    await cg.connect(bigboy).vote(ENACT)
    await expect(cg.connect(charlie).vote(REJECT)).to.be.revertedWith(
      ERRORS.COMMUNITYGOVERNANCE.WRONG_STAGE
    )

    // console.log(currCycle)
    await cg.execute()
    await time.increaseTo((await cg.cycleStart()).add(await cg.CYCLE_LENGTH()))
    await expect(cg.updateStage()).to.emit(cg, 'NewCycle').withArgs(1002)

    expect(await cg.stage()).to.eq(PROPOSAL)
    expect(await cg.cycleCount()).to.eq(currCycle.add(1))
    expect(await cg.selectedProposal()).to.eq(ethers.constants.AddressZero)
    expect(await cg.totalEnactVotes()).to.eq(0)
    expect(await cg.totalRejectVotes()).to.eq(0)
    expect(await cg.totalAbstainVotes()).to.eq(0)

    await cg.connect(bob).refund(A1)
  })
})
