import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import {
  TEST,
} from '../utils/constants'
import { ERRORS } from '../utils/errors'
import { DummyPoliced, DummyPoliced__factory } from '../../typechain-types'

describe('Policed', () => {
    let alice: SignerWithAddress
    let bob: SignerWithAddress
    let policyImpersonater: SignerWithAddress
    before(async () => {
      ;[policyImpersonater, alice, bob] = await ethers.getSigners()
    })

    let DummyPoliced: MockContract<DummyPoliced>
    let Fake__Policy: FakeContract
    beforeEach(async () => {
        // Get a new mock L1 messenger
        Fake__Policy = await smock.fake<Contract>(
          'Policy',
          { address: await policyImpersonater.getAddress() } // This allows us to make calls from the address
        )

        DummyPoliced = await (await smock.mock<DummyPoliced__factory>('DummyPoliced')).deploy(Fake__Policy.address)
    })

    describe('role get/set', () => {
        it('Policy set on contstructor', async () => {
            const contractPolicy = await DummyPoliced.policy()
            expect(contractPolicy === Fake__Policy.address).to.be.true
            expect(contractPolicy === policyImpersonater.address).to.be.true
        })

        it('Policy can set a new policy', async () => {
            await DummyPoliced.connect(policyImpersonater).setPolicy(alice.address)
            const contractPolicy = await DummyPoliced.policy()
            expect(contractPolicy === alice.address).to.be.true
        })

        it('Setting policy is onlyPolicy', async () => {
            await expect(
                DummyPoliced.connect(bob).setPolicy(bob.address)
            ).to.be.revertedWith(
                ERRORS.Policed.POLICY_ONLY
            )
        })
    })

    describe('role tests', () => {
        const newValue = 2

        it('Policy can call onlyPolicy functions', async () => {
            const initialValue = await DummyPoliced.value()
            expect(initialValue.eq(newValue)).to.be.false

            await DummyPoliced.connect(policyImpersonater).setValue(newValue)

            const changedValue = await DummyPoliced.value()
            expect(changedValue.eq(newValue)).to.be.true
            expect(changedValue.eq(initialValue)).to.be.false
        })

        it('Non-Policy cannot call onlyPolicy functions', async () => {
            await expect(
                DummyPoliced.connect(bob).setValue(newValue)
            ).to.be.revertedWith(
                ERRORS.Policed.POLICY_ONLY
            )
        })
    })

})
