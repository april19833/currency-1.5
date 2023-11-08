/* eslint-disable camelcase */
import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { expect } from 'chai'
import {
  smock,
  FakeContract,
  MockContract,
  MockContractFactory,
} from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ERRORS } from '../../utils/errors'
import {
  Notifier,
  Policy,
  Rebase,
  Notifier__factory,
  Rebase__factory,
  ECO,
  ECO__factory,
} from '../../../typechain-types'
import { deploy } from '../../../deploy/utils'

describe('Rebase', () => {
  let policyImpersonator: SignerWithAddress

  let currencyGovernanceImpersonator: SignerWithAddress

  let notifier: MockContract<Notifier>

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
      'Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )

    const ecoFactory: MockContractFactory<ECO__factory> = await smock.mock(
      'ECO'
    )
    eco = await ecoFactory.deploy(
      policy.address,
      policy.address // initial pauser
    )

    rebase = (await deploy(policyImpersonator, Rebase__factory, [
      policy.address,
      constants.AddressZero,
      eco.address,
    ])) as Rebase

    const notifierFactory: MockContractFactory<Notifier__factory> =
      await smock.mock('Notifier')
    notifier = await notifierFactory.deploy(
      policy.address,
      rebase.address,
      [],
      [],
      []
    )
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

    // still need to test this with the actual rebase functionality
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
