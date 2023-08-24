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
  DummyDownstream,
  DummyDownstream__factory,
  DummyPoliced,
  ECO,
  ECO__factory
} from '../../../typechain-types'

describe('notifier', () => {
  let policyImpersonator: SignerWithAddress

  let currencyGovernanceImpersonator: SignerWithAddress

  let notifier: Notifier

  let downstream: MockContract<DummyDownstream>

  let eco: MockContract<ECO>

  let policy: FakeContract<Policy>

  let rebase: MockContract<Rebase>

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
      policy.address, // distributor
      1000, // initial supply
      policy.address // initial pauser
    )
    const downstreamFactory: MockContractFactory<DummyDownstream__factory> = await smock.mock('DummyDownstream')
    downstream = await downstreamFactory.deploy();
    const rebaseFactory: MockContractFactory<Rebase__factory> = await smock.mock('Rebase')
    rebase = await rebaseFactory
      .connect(policyImpersonator)
      .deploy(policy.address, constants.AddressZero, eco.address)
    const notifierFactory = new Notifier__factory()
    console.log(DummyDownstream)
    notifier = await notifierFactory
      .connect(policyImpersonator)
      .deploy(
      policy.address,
      rebase.address, //lever
      [downstream.address], //targets
      [DummyDownstream.encodeFunctionData('callThatSucceeds')],
      // ["0xb8"],
      [123123123] //gasCosts
    )
    // await rebase.connect(policyImpersonator).setNotifier(notifier.address)
  })

  it('constructs', async () => {
    expect((await notifier.transactions(0)).target).to.eq(downstream.address)
  })

  // it('only lets authorized call execute', async () => {
  //   expect(await eco.rebased()).to.be.false
  //   const newMultiplier = 12345678
  //   expect(await rebase.authorized(currencyGovernanceImpersonator.address)).to
  //     .be.false
  //   await expect(
  //     rebase.connect(alice).execute(newMultiplier)
  //   ).to.be.revertedWith(ERRORS.Lever.AUTHORIZED_ONLY)

  //   await rebase.setAuthorized(currencyGovernanceImpersonator.address, true)
  //   expect(await rebase.authorized(currencyGovernanceImpersonator.address)).to
  //     .be.true

  //   // still need to test this with the actual rebase functionality
  //   await expect(
  //     rebase.connect(currencyGovernanceImpersonator).execute(newMultiplier)
  //   )
  //     .to.emit(rebase, 'Rebased')
  //     .withArgs(newMultiplier)

  //   expect(await eco.rebased()).to.be.true
  // })
})
