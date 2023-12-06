import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ERRORS } from '../utils/errors'
import { deployProxy } from '../../deploy/utils'
import { Policy } from '../../typechain-types/contracts/policy'
import { Policy__factory } from '../../typechain-types/factories/contracts/policy'
import { SampleProposal__factory } from '../../typechain-types/factories/contracts/test'
import { SampleProposal } from '../../typechain-types/contracts/test'
import {
  ClumsyFailureProposal,
  FailureProposal,
  TotalFailureProposal,
  WorseFailureProposal,
} from '../../typechain-types/contracts/test/FailureProposal.sol'
import {
  ClumsyFailureProposal__factory,
  FailureProposal__factory,
  TotalFailureProposal__factory,
  WorseFailureProposal__factory,
} from '../../typechain-types/factories/contracts/test/FailureProposal.sol'

const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'

describe('Policy', () => {
  let alice: SignerWithAddress
  let governanceImpersonator: SignerWithAddress
  before(async () => {
    ;[governanceImpersonator, alice] = await ethers.getSigners()
  })

  let policy: Policy

  beforeEach(async () => {
    policy = (
      await deployProxy(alice, Policy__factory, [
        governanceImpersonator.address,
      ])
    )[0] as Policy
  })

  describe('governor role', () => {
    it('checkable', async () => {
      const gorvernor = await policy.governor()
      expect(gorvernor).to.eq(governanceImpersonator.address)
    })

    it('enact is governor gated', async () => {
      await expect(
        policy.connect(alice).enact(PLACEHOLDER_ADDRESS1)
      ).to.be.revertedWith(ERRORS.Policy.GOVERNOR_ONLY)
    })

    context('with a sample policy', () => {
      let Proposal: SampleProposal

      beforeEach(async () => {
        Proposal = await new SampleProposal__factory().connect(alice).deploy()
      })

      it('Samplepolicy does anything', async () => {
        expect(await Proposal.counter()).to.eq(0)

        await policy.connect(governanceImpersonator).enact(Proposal.address)

        expect(await Proposal.counter()).to.eq(1)
      })

      it('enacting emits an event', async () => {
        await expect(
          policy.connect(governanceImpersonator).enact(Proposal.address)
        )
          .to.emit(policy, 'EnactedGovernanceProposal')
          .withArgs(Proposal.address, governanceImpersonator.address)
          .to.emit(policy, 'UpdatedGovernor')
          .withArgs(
            governanceImpersonator.address,
            await Proposal.NEW_GOVERNOR()
          )
      })

      context('with the policy enacted', () => {
        beforeEach(async () => {
          await policy.connect(governanceImpersonator).enact(Proposal.address)
        })

        it('can be changed by the policy', async () => {
          expect(await policy.governor()).to.eq(await Proposal.NEW_GOVERNOR())
        })
      })
    })

    context('with a failing proposal', () => {
      it('bubbles error', async () => {
        const Proposal: FailureProposal = await new FailureProposal__factory()
          .connect(alice)
          .deploy()

        await expect(
          policy.connect(governanceImpersonator).enact(Proposal.address)
        ).to.be.revertedWith(ERRORS.FailureProposal.PROPOSAL_FAILURE_ERROR)
      })

      it('bubbles error string', async () => {
        const Proposal: WorseFailureProposal =
          await new WorseFailureProposal__factory().connect(alice).deploy()

        await expect(
          policy.connect(governanceImpersonator).enact(Proposal.address)
        ).to.be.revertedWith(ERRORS.FailureProposal.PROPOSAL_FAILURE_STRING)
      })
      it('handles panics', async () => {
        const Proposal: ClumsyFailureProposal =
          await new ClumsyFailureProposal__factory().connect(alice).deploy()

        await expect(
          policy.connect(governanceImpersonator).enact(Proposal.address)
        ).to.be.revertedWith(ERRORS.FailureProposal.PANIC)
      })
      it('handles reverts', async () => {
        const Proposal: TotalFailureProposal =
          await new TotalFailureProposal__factory().connect(alice).deploy()

        await expect(
          policy.connect(governanceImpersonator).enact(Proposal.address)
        ).to.be.revertedWith(ERRORS.Policy.ENACTION_UNSPECIFIED_REVERT)
      })
    })
  })
})
