/* eslint-disable camelcase */
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  smock,
  FakeContract,
  MockContract,
  MockContractFactory,
} from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERRORS } from '../../utils/errors'
import { deploy } from '../../../deploy/utils'
import {
  Notifier,
  Rebase,
} from '../../../typechain-types/contracts/governance/monetary'
import { ECO } from '../../../typechain-types/contracts/currency'
import { Policy } from '../../../typechain-types/contracts/policy'
import { ECO__factory } from '../../../typechain-types/factories/contracts/currency'
import {
  Notifier__factory,
  Rebase__factory,
} from '../../../typechain-types/factories/contracts/governance/monetary'

describe('Rebase', () => {
  let policyImpersonator: SignerWithAddress

  let currencyGovernanceImpersonator: SignerWithAddress

  let notifier: Notifier

  let eco: MockContract<ECO>

  let policy: FakeContract<Policy>

  let rebase: Rebase

  let alice: SignerWithAddress

  before(async () => {
    ;[policyImpersonator, currencyGovernanceImpersonator, alice] =
      await ethers.getSigners()
  })

  beforeEach(async () => {
    policy = await smock.fake<Policy>(
      'contracts/policy/Policy.sol:Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )

    const ecoFactory: MockContractFactory<ECO__factory> = await smock.mock(
      'contracts/currency/ECO.sol:ECO'
    )
    eco = await ecoFactory.deploy(
      policy.address,
      policy.address // initial pauser
    )

    rebase = (await deploy(policyImpersonator, Rebase__factory, [
      policy.address,
      eco.address,
    ])) as Rebase

    notifier = (await deploy(policyImpersonator, Notifier__factory, [
      policy.address,
      rebase.address, // lever
      [], // targets
      [],
      [], // gasCosts
    ])) as Notifier
    rebase.connect(policyImpersonator).setNotifier(notifier.address)

    await eco.connect(policyImpersonator).updateRebasers(rebase.address, true)
  })

  it('constructs', async () => {
    expect(await rebase.eco()).to.eq(eco.address)
  })

  it('only lets authorized call execute', async () => {
    const initialInflationMult = await eco.inflationMultiplier()
    expect(await eco.INITIAL_INFLATION_MULTIPLIER()).to.eq(initialInflationMult)
    const newMultiplier = 12345678
    expect(await rebase.authorized(currencyGovernanceImpersonator.address)).to
      .be.false
    await expect(
      rebase.connect(alice).execute(newMultiplier)
    ).to.be.revertedWith(ERRORS.Lever.AUTHORIZED_ONLY)

    await rebase.setAuthorized(currencyGovernanceImpersonator.address, true)
    expect(await rebase.authorized(currencyGovernanceImpersonator.address)).to
      .be.true

    await expect(
      rebase.connect(currencyGovernanceImpersonator).execute(newMultiplier)
    )
      .to.emit(rebase, 'Rebased')
      .withArgs(newMultiplier)

    expect(await eco.inflationMultiplier()).to.eq(newMultiplier)
  })

  it('errors on bad inflationmultiplier', async () => {
    await rebase.setAuthorized(currencyGovernanceImpersonator.address, true)
    const lowMultiplier = 0

    await expect(
      rebase.connect(currencyGovernanceImpersonator).execute(lowMultiplier)
    ).to.be.revertedWith(ERRORS.Rebase.BAD_INFLATION_MULTIPLIER)

    const highMultiplier = '10000000000000000000'

    await expect(
      rebase.connect(currencyGovernanceImpersonator).execute(highMultiplier)
    ).to.be.revertedWith(ERRORS.Rebase.BAD_INFLATION_MULTIPLIER)
  })
})
