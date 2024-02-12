/* eslint-disable camelcase */
import { ethers } from 'hardhat'
import { BigNumberish, constants } from 'ethers'
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
  Notifier__factory,
  Rebase__factory,
} from '../../../typechain-types/factories/contracts/governance/monetary'
import {
  Notifier,
  Rebase,
} from '../../../typechain-types/contracts/governance/monetary'
import { DummyDownstream } from '../../../typechain-types/contracts/test'
import { ECO } from '../../../typechain-types/contracts/currency'
import { Policy } from '../../../typechain-types/contracts/policy'
import { ECO__factory } from '../../../typechain-types/factories/contracts/currency'
import { DummyDownstream__factory } from '../../../typechain-types/factories/contracts/test'

describe('notifier', () => {
  let policyImpersonator: SignerWithAddress

  const notifierFactory = new Notifier__factory()

  let notifier: Notifier

  let downstream: MockContract<DummyDownstream>

  let eco: MockContract<ECO>

  let policy: FakeContract<Policy>

  let rebase: MockContract<Rebase>

  let alice: SignerWithAddress

  const newInflationMult = 123123

  before(async () => {
    ;[policyImpersonator, alice] = await ethers.getSigners()
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
    const downstreamFactory: MockContractFactory<DummyDownstream__factory> =
      await smock.mock('contracts/test/DummyDownstream.sol:DummyDownstream')
    downstream = await downstreamFactory.deploy()
    const rebaseFactory: MockContractFactory<Rebase__factory> =
      await smock.mock('contracts/governance/monetary/Rebase.sol:Rebase')
    rebase = await rebaseFactory
      .connect(policyImpersonator)
      .deploy(policy.address, eco.address)
    notifier = (await deploy(policyImpersonator, Notifier__factory, [
      policy.address,
      rebase.address, // lever
      [downstream.address], // targets
      [downstream.interface.encodeFunctionData('callThatSucceeds')],
      [12341234], // gasCosts
    ])) as Notifier
    await eco.connect(policyImpersonator).updateRebasers(rebase.address, true)
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
          newInflationMult
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
      await rebase.connect(alice).execute(newInflationMult)
      expect(await target.notified()).to.be.true
    })

    it('doesnt impede lever call if notifier tx fails', async () => {
      await notifier
        .connect(policyImpersonator)
        .addTransaction(
          downstream.address,
          downstream.interface.encodeFunctionData('callThatFails'),
          newInflationMult
        )
      await rebase
        .connect(policyImpersonator)
        .setAuthorized(alice.address, true)

      const initialInflationMult = await eco.inflationMultiplier()
      expect(await eco.INITIAL_INFLATION_MULTIPLIER()).to.eq(
        initialInflationMult
      )
      expect(await downstream.pigsFly()).to.be.false
      await expect(rebase.connect(alice).execute(newInflationMult))
        .to.emit(notifier, 'TransactionFailed')
        .withArgs(
          1,
          downstream.address,
          downstream.interface.encodeFunctionData('callThatFails')
        )
      expect(await eco.inflationMultiplier()).to.eq(newInflationMult)
      expect(await downstream.pigsFly()).to.be.false
    })

    it('only Lever can call notify', async () => {
      const target = DummyDownstream__factory.connect(
        (await notifier.transactions(0)).target,
        alice
      )

      expect(await target.notified()).to.be.false
      await expect(notifier.connect(alice).notify()).to.be.revertedWith(
        ERRORS.Notifier.NON_LEVER_CALL
      )

      await notifier.connect(policyImpersonator).changeLever(alice.address)

      expect(await target.notified()).to.be.false
      await notifier.connect(alice).notify()
      expect(await target.notified()).to.be.true
    })
  })
  describe('gas', async () => {
    type transaction = {
      target: string
      data: string
      gasCost: BigNumberish
    }
    let target: any
    let tx: transaction
    let baseExecCost: Number
    beforeEach(async () => {
      target = DummyDownstream__factory.connect(
        (await notifier.transactions(0)).target,
        alice
      )
      await rebase
        .connect(policyImpersonator)
        .setAuthorized(alice.address, true)
      tx = await notifier.transactions(0)
      // remove tx and run execute to see tx cost without notify
      await notifier.connect(policyImpersonator).removeTransaction(0)
      baseExecCost = (
        await rebase.connect(alice).execute(newInflationMult)
      ).gasLimit.toNumber()
    })
    it(' uses less than the gascost provided', async () => {
      // now put it back
      await notifier
        .connect(policyImpersonator)
        .addTransaction(tx.target, tx.data, Number(tx.gasCost))

      expect(await target.notified()).to.be.false
      const gasCost = (await notifier.transactions(0)).gasCost
      const newtx = await rebase.connect(alice).execute(newInflationMult)
      await newtx.wait()
      expect(newtx.gasLimit.toNumber() - Number(baseExecCost)).to.be.lessThan(
        Number(gasCost)
      )

      expect(await target.notified()).to.be.true
    })
    it('fails to notify if gas cost provided is too low', async () => {
      // now put it back, but with gas = 1000 this time
      await notifier
        .connect(policyImpersonator)
        .addTransaction(tx.target, tx.data, 1000)

      expect(await target.notified()).to.be.false
      const gasCost = (await notifier.transactions(0)).gasCost
      const newtx = await rebase.connect(alice).execute(newInflationMult)
      await newtx.wait()
      expect(newtx.gasLimit.toNumber() - Number(baseExecCost)).to.be.lessThan(
        Number(gasCost)
      )

      expect(await target.notified()).to.not.be.true
    })
  })
})
