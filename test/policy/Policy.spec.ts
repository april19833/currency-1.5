import { ethers } from 'hardhat'
import { smock, MockContract, MockContractFactory } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ERRORS } from '../utils/errors'
import {
  Policy__factory,
  Policy,
  SampleProposal__factory,
  SampleProposal,
  FailureProposal__factory,
  FailureProposal,
  WorseFailureProposal,
  WorseFailureProposal__factory,
  TotalFailureProposal__factory,
  TotalFailureProposal,
  ClumsyFailureProposal,
  ClumsyFailureProposal__factory,
} from '../../typechain-types'

const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'

describe.only('Policy', () => {
  let alice: SignerWithAddress
  let governanceImpersonator: SignerWithAddress
  before(async () => {
    ;[governanceImpersonator, alice] = await ethers.getSigners()
  })

  let Policy: MockContract<Policy>

  beforeEach(async () => {
    const Policyfact: MockContractFactory<Policy__factory> = await smock.mock(
        'Policy'
    )

    Policy = await Policyfact.deploy()

    const governing: any = {}
    governing[governanceImpersonator.address] = true

    await Policy.setVariable('governors', governing)
  })

describe('governor role', () => {
    it('checkable', async () => {
        const gorverning = await Policy.governors(governanceImpersonator.address)
        expect(gorverning).to.be.true
    })

    it('enact is governor gated', async () => {
        await expect(Policy.connect(alice).enact(PLACEHOLDER_ADDRESS1))
            .to.be.revertedWith(ERRORS.Policy.GOVERNOR_ONLY)
    })

    context('with a sample policy', () => {
        let Proposal: SampleProposal

        beforeEach(async () => {
            Proposal = await (new SampleProposal__factory).connect(alice).deploy()
        })

        it('SamplePolicy does anything', async () => {
            expect(await Proposal.REMOVE_GOVERNOR()).to.eq(governanceImpersonator.address)
            expect(await Proposal.counter()).to.eq(0)
    
            await Policy.connect(governanceImpersonator).enact(Proposal.address)
    
            expect(await Proposal.counter()).to.eq(1)
        })

        it('enacting emits an event', async () => {
            await expect(Policy.connect(governanceImpersonator).enact(Proposal.address))
                .to.emit(Policy, 'EnactedGovernanceProposal')
                .withArgs(Proposal.address, governanceImpersonator.address)
                .to.emit(Policy, 'UpdatedGovernors')
                .withArgs(governanceImpersonator.address, false)
                .to.emit(Policy, 'UpdatedGovernors')
                .withArgs(await Proposal.NEW_GOVERNOR(), true)
        })

        context('with the policy enacted', ()=>{
            beforeEach(async () => {
                await Policy.connect(governanceImpersonator).enact(Proposal.address)
            })

            it('can be removed by the policy', async () => {
                expect(await Policy.governors(governanceImpersonator.address)).to.be.false
            })
    
            it('can be added by the policy', async () => {
                expect(await Policy.governors(await Proposal.NEW_GOVERNOR())).to.be.true
            })
        })  
    })

    context('with a failing proposal', () => {
        it('bubbles error', async () => {
            const Proposal: FailureProposal = await (new FailureProposal__factory).connect(alice).deploy()

            await expect(Policy.connect(governanceImpersonator).enact(Proposal.address))
                .to.be.revertedWith(ERRORS.FailureProposal.PROPOSAL_FAILURE_ERROR)
        })

        it('bubbles error string', async () => {
            const Proposal: WorseFailureProposal = await (new WorseFailureProposal__factory).connect(alice).deploy()

            await expect(Policy.connect(governanceImpersonator).enact(Proposal.address))
                .to.be.revertedWith(ERRORS.FailureProposal.PROPOSAL_FAILURE_STRING)
        })
        it('handles panics', async () => {
            const Proposal: ClumsyFailureProposal = await (new ClumsyFailureProposal__factory).connect(alice).deploy()

            await expect(Policy.connect(governanceImpersonator).enact(Proposal.address))
                .to.be.revertedWith(ERRORS.FailureProposal.PANIC)
        })
        it('handles reverts', async () => {
            const Proposal: TotalFailureProposal = await (new TotalFailureProposal__factory).connect(alice).deploy()

            await expect(Policy.connect(governanceImpersonator).enact(Proposal.address))
                .to.be.revertedWith(ERRORS.Policy.ENACTION_UNSPECIFIED_REVERT)
        })
    })
  })
})
