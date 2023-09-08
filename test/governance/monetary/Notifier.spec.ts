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
  ECO,
  ECO__factory,
} from '../../../typechain-types'

describe('notifier', () => {
  let policyImpersonator: SignerWithAddress

  const notifierFactory = new Notifier__factory()

  let notifier: Notifier

  let downstream: MockContract<DummyDownstream>

  let eco: MockContract<ECO>

  let policy: FakeContract<Policy>

  let rebase: MockContract<Rebase>

  let alice: SignerWithAddress

  before(async () => {
    ;[policyImpersonator, alice] = await ethers.getSigners()
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
    const downstreamFactory: MockContractFactory<DummyDownstream__factory> =
      await smock.mock('DummyDownstream')
    downstream = await downstreamFactory.deploy()
    const rebaseFactory: MockContractFactory<Rebase__factory> =
      await smock.mock('Rebase')
    rebase = await rebaseFactory
      .connect(policyImpersonator)
      .deploy(policy.address, constants.AddressZero, eco.address)
    notifier = await notifierFactory.connect(policyImpersonator).deploy(
      policy.address,
      rebase.address, // lever
      [downstream.address], // targets
      [downstream.interface.encodeFunctionData('callThatSucceeds')],
      [12341234] // gasCosts
    )
    await rebase.connect(policyImpersonator).setNotifier(notifier.address)
  })
  describe('construction', async () => {
    it('constructs', async () => {
      expect(await notifier.lever()).to.eq(rebase.address)
      expect((await notifier.transactions(0)).target).to.eq(downstream.address)
      expect((await notifier.transactions(0)).data).to.eq(
        downstream.interface.encodeFunctionData('callThatSucceeds')
      )
      expect((await notifier.transactions(0)).gasCost).to.eq(12341234)

      expect(await notifier.totalGasCost()).to.eq(12341234)
    })

    it('checks for transaction data length mismatch', async () => {
      await expect(
        notifierFactory
          .connect(policyImpersonator)
          .deploy(
            policy.address,
            rebase.address,
            [downstream.address],
            [],
            [12341234]
          )
      ).to.be.revertedWith(ERRORS.Notifier.TRANSACTION_DATA_LENGTH_MISMATCH)
      await expect(
        notifierFactory
          .connect(policyImpersonator)
          .deploy(
            policy.address,
            rebase.address,
            [downstream.address],
            [downstream.interface.encodeFunctionData('callThatSucceeds')],
            []
          )
      ).to.be.revertedWith(ERRORS.Notifier.TRANSACTION_DATA_LENGTH_MISMATCH)
    })
  })

  it('does not let non-policy addresses change the lever or add/remove txes', async () => {
    await expect(
      notifier.connect(alice).changeLever(constants.AddressZero)
    ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    await expect(
      notifier
        .connect(alice)
        .addTransaction(
          downstream.address,
          downstream.interface.encodeFunctionData('callThatFails'),
          123123
        )
    ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    await expect(
      notifier.connect(alice).removeTransaction(0)
    ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
  })

  it('changes lever', async () => {
    expect(await notifier.lever()).to.not.eq(alice.address)
    await notifier.connect(policyImpersonator).changeLever(alice.address)
    expect(await notifier.lever()).to.eq(alice.address)
  })

  it('adds a transaction', async () => {
    await expect(notifier.transactions(1)).to.be.reverted
    await notifier
      .connect(policyImpersonator)
      .addTransaction(
        downstream.address,
        downstream.interface.encodeFunctionData('callThatFails'),
        43214321
      )
    const newtx = await notifier.transactions(1)
    expect(newtx.target).to.eq(downstream.address)
    expect(newtx.data).to.eq(
      downstream.interface.encodeFunctionData('callThatFails')
    )
    expect(newtx.gasCost).to.eq(43214321)

    expect(await notifier.totalGasCost()).to.eq(55555555)
  })

  describe('removing a transaction', async () => {
    it('removes a transaction', async () => {
      await expect(notifier.transactions(0)).to.not.be.reverted
      await notifier.connect(policyImpersonator).removeTransaction(0)

      await expect(notifier.transactions(0)).to.be.reverted

      expect(await notifier.totalGasCost()).to.eq(0)
    })

    it('reverts on attempt to remove tx from index where no tx exists', async () => {
      await expect(
        notifier.connect(policyImpersonator).removeTransaction(1)
      ).to.be.revertedWith(ERRORS.Notifier.NO_TRANSACTION_AT_INDEX)
    })
  })

  describe('notifying', async () => {
    it('notifies successfully on execute call to lever', async () => {
      const target = DummyDownstream__factory.connect(
        (await notifier.transactions(0)).target,
        alice
      )
      await rebase
        .connect(policyImpersonator)
        .setAuthorized(alice.address, true)

      expect(await target.notified()).to.be.false
      await rebase.connect(alice).execute(123123)
      expect(await target.notified()).to.be.true
    })

    it('doesnt impede lever call if notifier tx fails', async () => {
      await notifier
        .connect(policyImpersonator)
        .addTransaction(
          downstream.address,
          downstream.interface.encodeFunctionData('callThatFails'),
          123123
        )
      await rebase
        .connect(policyImpersonator)
        .setAuthorized(alice.address, true)

      expect(await eco.rebased()).to.be.false
      expect(await downstream.pigsFly()).to.be.false
      await expect(rebase.connect(alice).execute(123123))
        .to.emit(notifier, 'TransactionFailed')
        .withArgs(
          1,
          downstream.address,
          downstream.interface.encodeFunctionData('callThatFails')
        )
      expect(await eco.rebased()).to.be.true
      expect(await downstream.pigsFly()).to.be.false
    })
  })
})