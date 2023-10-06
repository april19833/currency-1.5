import { ethers } from 'hardhat'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ERRORS } from '../utils/errors'
import {
  DummyPoliced,
  DummyPoliced__factory,
  Policy,
} from '../../typechain-types'

describe('Policed', () => {
  let alice: SignerWithAddress
  let policyImpersonator: SignerWithAddress
  before(async () => {
    ;[policyImpersonator, alice] = await ethers.getSigners()
  })

  let DummyPoliced: MockContract<DummyPoliced>
  let Fake__Policy: FakeContract<Policy>
  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'Policy',
      { address: await policyImpersonator.getAddress() } // This allows us to make calls from the address
    )

    DummyPoliced = await (
      await smock.mock<DummyPoliced__factory>('DummyPoliced')
    ).deploy(Fake__Policy.address)
  })

  describe('role get/set', () => {
    it('Policy set on contstructor', async () => {
      const contractPolicy = await DummyPoliced.policy()
      expect(contractPolicy === Fake__Policy.address).to.be.true
      expect(contractPolicy === policyImpersonator.address).to.be.true
    })
  })

  describe('role tests', () => {
    const newValue = 2

    it('Policy can call onlyPolicy functions', async () => {
      const initialValue = await DummyPoliced.value()
      expect(initialValue).to.not.eq(newValue)

      await DummyPoliced.connect(policyImpersonator).setValue(newValue)

      const changedValue = await DummyPoliced.value()
      expect(changedValue).to.eq(newValue)
      expect(changedValue).to.not.eq(initialValue)
    })

    it('Non-Policy cannot call onlyPolicy functions', async () => {
      await expect(
        DummyPoliced.connect(alice).setValue(newValue)
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    })
  })
})
