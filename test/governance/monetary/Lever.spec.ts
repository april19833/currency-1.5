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
  Lever,
  Notifier__factory,
  Lever__factory,
} from '../../../typechain-types'
import { deploy } from '../../../deploy/utils'

describe('Lever', () => {
  let policyImpersonator: SignerWithAddress

  let notifier: MockContract<Notifier>

  let policy: FakeContract<Policy>

  let lever: Lever

  let alice: SignerWithAddress

  before(async () => {
    ;[policyImpersonator, alice] = await ethers.getSigners()
  })

  beforeEach(async () => {
    policy = await smock.fake<Policy>(
      'Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )

    lever = await deploy(policyImpersonator, Lever__factory,[policy.address, constants.AddressZero]) as Lever

    const notifierFactory: MockContractFactory<Notifier__factory> =
      await smock.mock('Notifier')
    notifier = await notifierFactory.deploy(
      policy.address,
      lever.address,
      [],
      [],
      []
    )
  })

  it('constructs', async () => {
    expect(await lever.policy()).to.eq(policy.address)
    expect(await lever.notifier()).to.eq(constants.AddressZero)
  })

  it('only lets policy call setAuthorized', async () => {
    expect(await lever.authorized(alice.address)).to.be.false
    await expect(
      lever.connect(alice).setAuthorized(alice.address, true)
    ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)

    await expect(
      lever.connect(policyImpersonator).setAuthorized(alice.address, true)
    )
      .to.emit(lever, 'AuthorizationChanged')
      .withArgs(alice.address, true)

    expect(await lever.authorized(alice.address)).to.be.true
  })

  it('only lets policy call setNotifier', async () => {
    expect(await lever.notifier()).to.not.equal(notifier.address)
    await expect(
      lever.connect(alice).setNotifier(notifier.address)
    ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)

    await expect(
      lever.connect(policyImpersonator).setNotifier(notifier.address)
    )
      .to.emit(lever, 'NotifierChanged')
      .withArgs(constants.AddressZero, notifier.address)
    expect(await lever.notifier()).to.equal(notifier.address)
  })
})
