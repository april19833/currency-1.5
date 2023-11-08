import { ethers } from 'hardhat'
// import { constants } from 'ethers'
import { expect } from 'chai'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
// import { DAY } from '../../utils/constants'
import { ERRORS } from '../../utils/errors'
import {
  CommunityGovernance,
  CommunityGovernance__factory,
  Policy,
  ECO,
  ECO__factory,
  ECOxStaking,
  ECOxStaking__factory,
} from '../../../typechain-types'

const A1 = '0x1111111111111111111111111111111111111111'
const A2 = '0x2222222222222222222222222222222222222222'
const INITIAL_SUPPLY = ethers.utils.parseEther('100')
const INIT_BALANCE = 20000
const INIT_BIG_BALANCE = 100000

// enum values
const DONE = 0
const PROPOSAL = 1
const VOTING = 2
const DELAY = 3
const EXECUTION = 4

describe.only('Community Governance', () => {
  let policyImpersonator: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress
  let dave: SignerWithAddress
  before(async () => {
    ;[policyImpersonator, alice, bob, charlie, dave] = await ethers.getSigners()
  })
  let policy: FakeContract<Policy>
  let eco: MockContract<ECO>
  let ecoXStaking: MockContract<ECOxStaking>

  //   let cg: CommunityGovernance
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
      A1, // distributor - can we take this variable out?
      INITIAL_SUPPLY, // initialSupply - can we take this variable out?
      alice.address // pauser
    )

    await eco
      .connect(policyImpersonator)
      .updateMinters(policyImpersonator.address, true)
    await eco.connect(alice).enableVoting()
    await eco.connect(policyImpersonator).mint(alice.address, INIT_BALANCE)
    await eco.connect(bob).enableVoting()
    await eco.connect(policyImpersonator).mint(bob.address, INIT_BALANCE)
    await eco.connect(charlie).enableVoting()
    await eco.connect(policyImpersonator).mint(charlie.address, INIT_BALANCE)
    await eco.connect(dave).enableVoting()
    await eco.connect(policyImpersonator).mint(dave.address, INIT_BIG_BALANCE)

    ecoXStaking = await (
      await smock.mock<ECOxStaking__factory>('ECOxStaking')
    ).deploy(
      policy.address,
      A2 // ECOx
    )

    // cg = await new CommunityGovernance__factory()
    //   .connect(policyImpersonator)
    //   .deploy(
    //     policy.address,
    //     eco.address,
    //     ecoXStaking.address,
    //     alice.address // pauser
    //   )
    cg = await (
      await smock.mock<CommunityGovernance__factory>('CommunityGovernance')
    ).deploy(
      policy.address,
      eco.address,
      ecoXStaking.address,
      alice.address // pauser
    )
    // await cg.setVariable()
    await eco.connect(policyImpersonator).updateSnapshotters(cg.address, true)
  })
  describe('constructor', async () => {
    it('Constructs', async () => {
      expect(await cg.policy()).to.eq(policy.address)
      expect(await cg.ecoToken()).to.eq(eco.address)
      expect(await cg.ecoXStaking()).to.eq(ecoXStaking.address)
      expect(await cg.pauser()).to.eq(alice.address)
    })

    it('has correct values for cycleCount, cycleStart, stage, currentStageEnd', async () => {
      expect(await cg.cycleCount()).to.eq(1000)
      expect(await cg.cycleStart()).to.eq(0)
      expect(await cg.currentStageEnd()).to.eq(0)
      expect(await cg.stage()).to.eq(DONE)
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
    it('only lets Policy drain the pot', async () => {
      await expect(cg.connect(alice).sweep(alice.address)).to.be.revertedWith(
        ERRORS.Policed.POLICY_ONLY
      )
      await cg.connect(policyImpersonator).sweep(alice.address)
    })
  })

  describe('updateStage', async () => {
    it('works fine right after deployment with cycleStart = 0', async () => {
      await expect(cg.updateStage())
        .to.emit(cg, 'NewCycle')
        .withArgs(1001)
        .to.emit(cg, 'StageUpdated')
        .withArgs(PROPOSAL)
      expect(await cg.cycleStart()).to.eq(await time.latest())
      expect(await cg.currentStageEnd()).to.eq(
        (await cg.PROPOSAL_LENGTH()).add(await time.latest())
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
    xit('updates to delay from voting if there are more enact votes', async () => {
      await cg.updateStage()
      await time.increaseTo(await cg.currentStageEnd())

      await cg.setVariable('totalEnactVotes', 10)
      // abstain votes dont matter but lets prove it
      await cg.setVariable('totalAbstainVotes', 100)

      await expect(cg.updateStage()).to.emit(cg, 'StageUpdated').withArgs(DELAY)

      expect(await cg.stage()).to.eq(DELAY)
      expect(await cg.currentStageEnd()).to.eq(
        (await cg.cycleStart()).add(await cg.DELAY_LENGTH())
      )
    })
  })

  context('proposal stage', async () => {
    it('fails if called during not-proposal stage', async () => {
      expect(await cg.stage()).to.not.eq(PROPOSAL)
      // prevents automatic stage update to proposal stage
      await cg.setVariable('currentStageEnd', (await time.latest()) + 100)

      await expect(cg.connect(alice).propose(A1)).to.be.revertedWith(
        ERRORS.COMMUNITYGOVERNANCE.WRONG_STAGE
      )
    })
    describe('proposing', () => {
      beforeEach(async () => {
        await cg.updateStage()
      })
      it('registers a proposal and its data correctly', async () => {
        await eco.connect(alice).approve(cg.address, await cg.proposalFee())
        await expect(cg.connect(alice).propose(A1))
          .to.emit(cg, 'ProposalRegistration')
          .withArgs(alice.address, A1)
        expect((await cg.proposals(A1)).cycle).to.eq(await cg.cycleCount())
        expect((await cg.proposals(A1)).proposer).to.eq(alice.address)
        expect((await cg.proposals(A1)).totalSupport).to.eq(0)
        expect((await cg.proposals(A1)).refund).to.eq(
          (await cg.proposalFee()).mul(await cg.refundPercent()).div(100)
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
      it('fails if called during not support phase')
    })
    describe('Supporting', () => {
      beforeEach(async () => {
        await eco.connect(alice).approve(cg.address, await cg.proposalFee())
        await eco.connect(bob).approve(cg.address, await cg.proposalFee())
        await cg.connect(alice).propose(A1)
        await cg.connect(bob).propose(A2)
      })
      context('support method', () => {
        it('performs a single support correctly', async () => {
          const vp = await cg.votingPower(
            alice.address,
            await cg.snapshotBlock()
          )
          await expect(cg.connect(alice).support(A1))
            .to.emit(cg, 'SupportChanged')
            .withArgs(alice.address, A1, 0, vp)
          // having trouble reading from a mapping within a struct within a mapping, going to just work around it for now
          // expect((await cg.proposals(A1)).support).to.eq(vp)
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
          expect((await cg.proposals(A1)).totalSupport).to.eq(vp)
          await cg.connect(alice).support(A1)
          expect((await cg.proposals(A1)).totalSupport).to.eq(vp)
        })
      })
      context('partial support', () => {
        it('fails if proposal and allocation arrays are different lengths', async () => {
          const supports = [A1, A2]
          const allocations = [1]
          await expect(
            cg.supportPartial(supports, allocations)
          ).to.be.revertedWith(ERRORS.COMMUNITYGOVERNANCE.ARRAY_LENGTH_MISMATCH)
        })
        it('fails')
      })
    })
  })

  describe('voting stage', () => {})
})
