import { ethers } from 'hardhat'
import { smock, FakeContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ERRORS } from '../utils/errors'
import { deploy } from '../../deploy/utils'
import { Policy } from '../../typechain-types/contracts/policy'
import { DummyPoliced } from '../../typechain-types/contracts/test'
import { DummyPoliced__factory } from '../../typechain-types/factories/contracts/test'

describe('Policed', () => {
  let alice: SignerWithAddress
  let policyImpersonator: SignerWithAddress
  before(async () => {
    ;[policyImpersonator, alice] = await ethers.getSigners()
  })

  let DummyPoliced: DummyPoliced
  let Fake__Policy: FakeContract<Policy>
  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'contracts/policy/Policy.sol:Policy',
      { address: policyImpersonator.address } // This allows us to make calls from the address
    )

    DummyPoliced = (await deploy(policyImpersonator, DummyPoliced__factory, [
      Fake__Policy.address,
    ])) as DummyPoliced
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
