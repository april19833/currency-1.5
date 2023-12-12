import { ethers } from 'hardhat'
import { smock, FakeContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ERRORS } from '../utils/errors'
import {
  DummyPolicedUpgradeable,
  DummyPolicedUpgradeable__factory,
  Policy,
} from '../../typechain-types'
import { deploy, deployProxy } from '../../deploy/utils'

describe('PolicedUpgradeable', () => {
  let alice: SignerWithAddress
  let policyImpersonator: SignerWithAddress
  before(async () => {
    ;[policyImpersonator, alice] = await ethers.getSigners()
  })

  let DummyPolicedUpgradeable: DummyPolicedUpgradeable
  let DummyPolicedUpgradeableImpl: DummyPolicedUpgradeable
  let Fake__Policy: FakeContract<Policy>
  beforeEach(async () => {
    Fake__Policy = await smock.fake<Policy>(
      'contracts/policy/Policy.sol:Policy',
      { address: policyImpersonator.address } // This allows us to make calls from the address
    )

    const contracts = (await deployProxy(
      policyImpersonator,
      DummyPolicedUpgradeable__factory,
      [Fake__Policy.address]
    )) as [DummyPolicedUpgradeable, DummyPolicedUpgradeable]
    ;[DummyPolicedUpgradeable, DummyPolicedUpgradeableImpl] = contracts
  })

  describe('impl', () => {
    it('implementation set on contstructor', async () => {
      expect(await DummyPolicedUpgradeable.implementation()).to.eq(
        DummyPolicedUpgradeableImpl.address
      )
    })
  })

  describe('upgrade', () => {
    let NewImpl: DummyPolicedUpgradeable

    beforeEach(async () => {
      NewImpl = (await deploy(
        policyImpersonator,
        DummyPolicedUpgradeable__factory,
        [policyImpersonator.address]
      )) as DummyPolicedUpgradeable
    })

    it('Policy can upgrade impl', async () => {
      await DummyPolicedUpgradeable.connect(
        policyImpersonator
      ).setImplementation(NewImpl.address)
      expect(await DummyPolicedUpgradeable.implementation()).to.not.eq(
        DummyPolicedUpgradeableImpl.address
      )
      expect(await DummyPolicedUpgradeable.implementation()).to.eq(
        NewImpl.address
      )
    })

    it('Non-Policy cannot upgrade impl', async () => {
      await expect(
        DummyPolicedUpgradeable.connect(alice).setImplementation(
          NewImpl.address
        )
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    })
  })
})
