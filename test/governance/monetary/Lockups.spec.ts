/* eslint-disable camelcase */
import { ethers } from 'hardhat'
import { BigNumber, constants } from 'ethers'
import { expect } from 'chai'
import {
  smock,
  FakeContract,
  MockContract,
  MockContractFactory,
} from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { ERRORS } from '../../utils/errors'
import {
  Lockups,
  Policy,
  ECO,
  ECO__factory,
  Lockups__factory,
} from '../../../typechain-types'
import { deploy } from '../../../deploy/utils'

describe('Lockups', () => {
  let policyImpersonator: SignerWithAddress

  let eco: MockContract<ECO>

  let policy: FakeContract<Policy>

  let lockups: Lockups

  let alice: SignerWithAddress

  let bob: SignerWithAddress

  let charlie: SignerWithAddress

  let dave: SignerWithAddress

  let matthew: SignerWithAddress

  let depositAmount: any

  let gons: any

  let interest: any

  const depositWindow = 600

  const goodDuration = 3600 * 24 * 60
  // 10%
  const goodRate = '100000000000000000'

  const BASE = '1000000000000000000'

  before(async () => {
    ;[policyImpersonator, alice, bob, charlie, dave, matthew] =
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
    await eco.setVariable('inflationMultiplier', BASE)

    lockups = (await deploy(policyImpersonator, Lockups__factory, [
      policy.address,
      constants.AddressZero, // notifier
      eco.address,
      depositWindow,
    ])) as Lockups

    await lockups.connect(policyImpersonator).setAuthorized(alice.address, true)
    await eco.connect(policyImpersonator).updateMinters(lockups.address, true)

    // mint initial tokens
    await eco
      .connect(policyImpersonator)
      .updateMinters(policyImpersonator.address, true)
    await eco.connect(policyImpersonator).mint(alice.address, 10000)
    await eco.connect(policyImpersonator).mint(bob.address, 10000)
    await eco.connect(policyImpersonator).mint(matthew.address, 10000)
    await eco
      .connect(policyImpersonator)
      .updateMinters(policyImpersonator.address, false)

    await eco.connect(alice).enableVoting()
    await eco.connect(bob).enableVoting()
    await eco.connect(charlie).enableVoting()
    await eco.connect(dave).enableVoting()

    await eco.connect(charlie).enableDelegationTo()
    await eco.connect(dave).enableDelegationTo()
    await eco.connect(alice).delegate(charlie.address)
  })

  it('constructs', async () => {
    expect(await lockups.eco()).to.eq(eco.address)
    expect(await lockups.depositWindow()).to.eq(depositWindow)
    expect(await lockups.currentInflationMultiplier()).to.eq(BASE)
  })

  describe('permissions', async () => {
    it('doesnt let nonauthorized create a lockup', async () => {
      expect(await lockups.authorized(bob.address)).to.be.false
      await expect(
        lockups.connect(bob).createLockup(goodDuration, goodRate)
      ).to.be.revertedWith(ERRORS.Lever.AUTHORIZED_ONLY)
    })

    it('doesnt let nonpolicy sweep funds', async () => {
      await expect(
        lockups.connect(bob).sweep(alice.address)
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    })
  })

  describe('createLockup', async () => {
    it('doesnt allow durations that are too low or too high', async () => {
      const lowDuration = (await lockups.MIN_DURATION()).sub(1)
      const highDuration = (await lockups.MAX_DURATION()).add(1)

      await expect(
        lockups.connect(alice).createLockup(lowDuration, goodRate)
      ).to.be.revertedWith(ERRORS.Lockups.BAD_DURATION)

      await expect(
        lockups.connect(alice).createLockup(highDuration, goodRate)
      ).to.be.revertedWith(ERRORS.Lockups.BAD_DURATION)
    })

    it('doesnt allow rates that are too high', async () => {
      const badRate = (await lockups.MAX_RATE()).add(1)
      await expect(
        lockups.connect(alice).createLockup(goodDuration, badRate)
      ).to.be.revertedWith(ERRORS.Lockups.BAD_RATE)
    })

    it('sets up lockup properly', async () => {
      await expect(lockups.connect(alice).createLockup(goodDuration, goodRate))
        .to.emit(lockups, 'LockupCreation')
        .withArgs(0, goodDuration, goodRate)
      const lockup = await lockups.lockups(0)
      expect(lockup.rate).to.eq(goodRate)
      expect(lockup.depositWindowEnd).to.eq(
        (await time.latest()) + Number(await lockups.depositWindow())
      )
      expect(lockup.end).to.eq(Number(lockup.depositWindowEnd) + goodDuration)
    })
  })

  describe('deposit', async () => {
    let inflationMultiplier: BigNumber

    beforeEach(async () => {
      await lockups.connect(alice).createLockup(goodDuration, goodRate)
      await time.increase(Number(await lockups.depositWindow()) / 2)
      await eco.connect(alice).approve(lockups.address, 10000)
      await eco.connect(bob).approve(lockups.address, 10000)
      await eco.connect(matthew).approve(lockups.address, 10000)
      inflationMultiplier = await lockups.currentInflationMultiplier()
    })
    it('does not allow late deposit', async () => {
      await time.increase(Number(await lockups.depositWindow()) / 2 + 1)
      await expect(lockups.connect(bob).deposit(1, 1000)).to.be.revertedWith(
        ERRORS.Lockups.LATE_DEPOSIT
      )
    })
    it('does single deposit properly', async () => {
      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(inflationMultiplier)
      interest = depositAmount.mul(goodRate).div(BASE)
      expect(await eco.getPrimaryDelegate(alice.address)).to.eq(charlie.address)
      expect(await eco.balanceOf(alice.address)).to.eq(depositAmount)
      expect(await eco.balanceOf(lockups.address)).to.eq(0)
      await expect(lockups.connect(alice).deposit(0, depositAmount))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, gons)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, alice.address, gons)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, alice.address)).to.eq(charlie.address)
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)
    })
    it('does single deposit properly for non-voter', async () => {
      depositAmount = await eco.balanceOf(matthew.address)
      gons = depositAmount.mul(inflationMultiplier)
      interest = depositAmount.mul(goodRate).div(BASE)
      expect(await eco.balanceOf(matthew.address)).to.eq(depositAmount)
      expect(await eco.balanceOf(lockups.address)).to.eq(0)
      await expect(lockups.connect(matthew).deposit(0, depositAmount))
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, matthew.address, gons)
      expect(await lockups.getGonsBalance(0, matthew.address)).to.eq(gons)
      expect(await lockups.getBalance(0, matthew.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, matthew.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, matthew.address)).to.eq(
        ethers.constants.AddressZero
      )
      expect(await eco.balanceOf(matthew.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)
      expect(await eco.voteBalanceOf(matthew.address)).to.eq(0)
      expect(await eco.voteBalanceOf(lockups.address)).to.eq(depositAmount)
    })

    it('does additional deposits in the same window properly', async () => {
      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(inflationMultiplier)
      interest = depositAmount.mul(goodRate).div(BASE)
      await expect(lockups.connect(alice).deposit(0, depositAmount.div(4)))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, gons.div(4))
      await expect(
        lockups.connect(alice).deposit(0, depositAmount.mul(3).div(4))
      )
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, gons.mul(3).div(4))
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, alice.address, gons.mul(3).div(4))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, alice.address)).to.eq(charlie.address)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)
    })

    it('does additional deposits in the same window properly when delegate changes', async () => {
      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(inflationMultiplier)
      interest = depositAmount.mul(goodRate).div(BASE)
      await expect(lockups.connect(alice).deposit(0, depositAmount.div(4)))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, gons.div(4))
      await eco.connect(alice).delegate(dave.address)
      await expect(
        lockups.connect(alice).deposit(0, depositAmount.mul(3).div(4))
      )
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, dave.address, gons)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, alice.address, gons.mul(3).div(4))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, alice.address)).to.eq(dave.address)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)
      expect(await eco.voteBalanceOf(dave.address)).to.eq(depositAmount)
      expect(await eco.voteBalanceOf(alice.address)).to.eq([0])
      expect(await eco.voteBalanceOf(charlie.address)).to.eq(0)
    })
    it('works as expected when two users deposit to the same lockup', async () => {
      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(inflationMultiplier)
      interest = depositAmount.mul(goodRate).div(BASE)
      await expect(lockups.connect(alice).deposit(0, depositAmount))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, gons)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, alice.address, gons)
      await expect(lockups.connect(bob).deposit(0, depositAmount))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, bob.address, gons)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, bob.address, gons)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, alice.address)).to.eq(charlie.address)
      expect(await lockups.getGonsBalance(0, bob.address)).to.eq(gons)
      expect(await lockups.getBalance(0, bob.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, bob.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, bob.address)).to.eq(bob.address)
      expect(await eco.balanceOf(lockups.address)).to.eq(20000)
    })
    it('works as expected when one users deposit to two different lockups', async () => {
      const otherRate = String(Number(goodRate) * 2)
      await lockups.connect(alice).createLockup(goodDuration, otherRate)
      const d0 = 4000
      const d1 = 6000
      await expect(lockups.connect(alice).deposit(0, d0))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, inflationMultiplier.mul(d0))
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, alice.address, inflationMultiplier.mul(d0))
      await expect(lockups.connect(alice).deposit(1, d1))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, inflationMultiplier.mul(d1))
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(1, alice.address, inflationMultiplier.mul(d1))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(
        inflationMultiplier.mul(d0)
      )
      expect(await lockups.getBalance(0, alice.address)).to.eq(d0)
      expect(await lockups.getYield(0, alice.address)).to.eq(
        (d0 * Number(goodRate)) / Number(BASE)
      )
      expect(await lockups.getDelegate(0, alice.address)).to.eq(charlie.address)

      expect(await lockups.getGonsBalance(1, alice.address)).to.eq(
        inflationMultiplier.mul(d1)
      )
      expect(await lockups.getBalance(1, alice.address)).to.eq(d1)
      expect(await lockups.getYield(1, alice.address)).to.eq(
        (d1 * Number(otherRate)) / Number(BASE)
      )
      expect(await lockups.getDelegate(1, alice.address)).to.eq(charlie.address)
      expect(await eco.balanceOf(lockups.address)).to.eq(d0 + d1)
    })
    it('depositsFor', async () => {
      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(inflationMultiplier)
      interest = depositAmount.mul(goodRate).div(BASE)
      expect(await eco.getPrimaryDelegate(alice.address)).to.eq(charlie.address)
      expect(await eco.balanceOf(alice.address)).to.eq(depositAmount)
      expect(await eco.balanceOf(lockups.address)).to.eq(0)
      await expect(
        lockups.connect(bob).depositFor(0, alice.address, depositAmount)
      )
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, gons)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, alice.address, gons)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, alice.address)).to.eq(charlie.address)
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)
      expect(await eco.balanceOf(bob.address)).to.eq(depositAmount)
    })
  })

  it('updates inflation multiplier', async () => {
    expect(await lockups.currentInflationMultiplier()).to.eq(BASE)
    const newInflationMultiplier = '123123123123123123'
    await eco.setVariable('inflationMultiplier', newInflationMultiplier)
    await lockups.updateInflationMultiplier()
    expect(await lockups.currentInflationMultiplier()).to.eq(
      newInflationMultiplier
    )
  })

  describe('withdraw early', async () => {
    let inflationMultiplier: BigNumber

    beforeEach(async () => {
      await lockups.connect(alice).createLockup(goodDuration, goodRate)
      await time.increase(Number(await lockups.depositWindow()) / 2)
      inflationMultiplier = await lockups.currentInflationMultiplier()

      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(inflationMultiplier)
      interest = depositAmount.mul(goodRate).div(BASE)

      await eco.connect(alice).approve(lockups.address, depositAmount)
      await eco.connect(matthew).approve(lockups.address, depositAmount)

      await lockups.connect(alice).deposit(0, depositAmount)
    })
    it('doesnt allow early withdrawFor during deposit window', async () => {
      await expect(
        lockups.connect(bob).withdrawFor(0, alice.address)
      ).to.be.revertedWith(ERRORS.Lockups.EARLY_WITHDRAW_FOR)
    })
    it('doesnt allow early withdrawFor during lockup period', async () => {
      await time.increase(Number(await lockups.depositWindow()) / 2 + 1)
      await expect(
        lockups.connect(bob).withdrawFor(0, alice.address)
      ).to.be.revertedWith(ERRORS.Lockups.EARLY_WITHDRAW_FOR)
    })
    it('levies correct penalty on early withdrawers', async () => {
      await lockups.connect(matthew).deposit(0, depositAmount)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(2))
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await eco.balanceOf(matthew.address)).to.eq(0)
      expect(await lockups.getGonsBalance(0, matthew.address)).to.eq(gons)
      expect(await lockups.getBalance(0, matthew.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, matthew.address)).to.eq(interest)

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount.sub(interest).mul(inflationMultiplier)
        )
      await expect(lockups.connect(matthew).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          matthew.address,
          depositAmount.sub(interest).mul(inflationMultiplier)
        )

      expect(await eco.balanceOf(lockups.address)).to.eq(interest.mul(2))
      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.sub(interest)
      )
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
      expect(await eco.balanceOf(matthew.address)).to.eq(
        depositAmount.sub(interest)
      )
      expect(await lockups.getGonsBalance(0, matthew.address)).to.eq(0)
      expect(await lockups.getBalance(0, matthew.address)).to.eq(0)
      expect(await lockups.getYield(0, matthew.address)).to.eq(0)
    })

    it('penalizes by the same interest amount despite inflationMultiplier changes', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)

      const newInflationMultiplier = inflationMultiplier.mul(2)
      await eco.setVariable('inflationMultiplier', newInflationMultiplier)
      await lockups.updateInflationMultiplier()

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount.div(2).sub(interest).mul(newInflationMultiplier)
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount / 2 - interest
      )
      // not sure how to mock eco s.t. i can simply set inflation multipliers
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
    })
  })

  describe('withdraw after end', async () => {
    let inflationMultiplier: BigNumber

    beforeEach(async () => {
      await lockups.connect(alice).createLockup(goodDuration, goodRate)
      await time.increase(Number(await lockups.depositWindow()) / 2)
      inflationMultiplier = await lockups.currentInflationMultiplier()

      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(inflationMultiplier)
      interest = depositAmount.mul(goodRate).div(BASE)

      await eco.connect(alice).approve(lockups.address, depositAmount)
      await eco.connect(bob).approve(lockups.address, depositAmount)
      await eco.connect(matthew).approve(lockups.address, depositAmount)

      await lockups.connect(alice).deposit(0, depositAmount)
      await lockups.connect(bob).deposit(0, depositAmount)
      await lockups.connect(matthew).deposit(0, depositAmount)
      await time.increaseTo((await lockups.lockups(0)).end.add(1))
    })
    it('withdraws full amount', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(3))

      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, alice.address)).to.eq(charlie.address)

      expect(await lockups.getGonsBalance(0, bob.address)).to.eq(gons)
      expect(await lockups.getBalance(0, bob.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, bob.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, bob.address)).to.eq(bob.address)

      expect(await lockups.getGonsBalance(0, matthew.address)).to.eq(gons)
      expect(await lockups.getBalance(0, matthew.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, matthew.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, matthew.address)).to.eq(
        ethers.constants.AddressZero
      )

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount.add(interest).mul(inflationMultiplier)
        )
      await expect(lockups.connect(matthew).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          matthew.address,
          depositAmount.add(interest).mul(inflationMultiplier)
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(bob.address)).to.eq(0)
      expect(await eco.balanceOf(matthew.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)

      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
      expect(await lockups.getDelegate(0, alice.address)).to.eq(
        ethers.constants.AddressZero
      )

      expect(await lockups.getGonsBalance(0, bob.address)).to.eq(gons)
      expect(await lockups.getBalance(0, bob.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, bob.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, bob.address)).to.eq(bob.address)

      expect(await lockups.getGonsBalance(0, matthew.address)).to.eq(0)
      expect(await lockups.getBalance(0, matthew.address)).to.eq(0)
      expect(await lockups.getYield(0, matthew.address)).to.eq(0)
      expect(await lockups.getDelegate(0, matthew.address)).to.eq(
        ethers.constants.AddressZero
      )
    })
    it('doesnt behave unexpectedly if they call withdraw twice', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(3))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount.add(interest).mul(inflationMultiplier)
        )

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(0, alice.address, 0)

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(2))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
    })
    it('withdrawsFor properly', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(3))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)

      await expect(lockups.connect(bob).withdrawFor(0, alice.address))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount.add(interest).mul(inflationMultiplier)
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(2))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
    })
    it('works when inflationMultiplier changes', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(3))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)

      const newInflationMultiplier = inflationMultiplier.mul(2)
      await eco.setVariable('inflationMultiplier', newInflationMultiplier)
      await lockups.updateInflationMultiplier()

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount.div(2).add(interest).mul(newInflationMultiplier)
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.div(2).add(interest)
      )
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
    })
    it('works when delegate changes', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(bob.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(3))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, alice.address)).to.eq(charlie.address)
      expect(await lockups.getGonsBalance(0, bob.address)).to.eq(gons)
      expect(await lockups.getBalance(0, bob.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, bob.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, bob.address)).to.eq(bob.address)

      await eco.connect(alice).delegate(dave.address)
      await eco.connect(bob).delegate(dave.address)
      // the amounts are still delegated from the lockup
      expect(await eco.voteBalanceOf(dave.address)).to.eq(0)
      expect(await eco.voteBalanceOf(charlie.address)).to.eq(depositAmount)
      expect(await eco.voteBalanceOf(bob.address)).to.eq(depositAmount)
      expect(await eco.voteBalanceOf(alice.address)).to.eq(0)

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount.add(interest).mul(inflationMultiplier)
        )
      await expect(lockups.connect(bob).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          bob.address,
          depositAmount.add(interest).mul(inflationMultiplier)
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
      expect(await lockups.getDelegate(0, alice.address)).to.eq(
        ethers.constants.AddressZero
      )
      expect(await eco.balanceOf(bob.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await lockups.getGonsBalance(0, bob.address)).to.eq(0)
      expect(await lockups.getBalance(0, bob.address)).to.eq(0)
      expect(await lockups.getYield(0, bob.address)).to.eq(0)
      expect(await lockups.getDelegate(0, bob.address)).to.eq(
        ethers.constants.AddressZero
      )

      expect(await eco.voteBalanceOf(dave.address)).to.eq(
        depositAmount.add(interest).mul(2)
      )
      expect(await eco.voteBalanceOf(charlie.address)).to.eq(0)
      expect(await eco.voteBalanceOf(bob.address)).to.eq(0)
      expect(await eco.voteBalanceOf(alice.address)).to.eq(0)
    })
    it('works when voter status changes', async () => {
      expect(await eco.balanceOf(matthew.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(3))
      expect(await lockups.getGonsBalance(0, matthew.address)).to.eq(gons)
      expect(await lockups.getBalance(0, matthew.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, matthew.address)).to.eq(interest)
      expect(await lockups.getDelegate(0, matthew.address)).to.eq(
        ethers.constants.AddressZero
      )

      await eco.connect(matthew).enableVoting()
      await eco.connect(matthew).delegate(dave.address)

      expect(await eco.voteBalanceOf(matthew.address)).to.eq(0)
      expect(await eco.voteBalanceOf(dave.address)).to.eq(0)

      expect(await lockups.getDelegate(0, matthew.address)).to.eq(
        ethers.constants.AddressZero
      )

      await expect(lockups.connect(matthew).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          matthew.address,
          depositAmount.add(interest).mul(inflationMultiplier)
        )

      expect(await eco.balanceOf(matthew.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await lockups.getGonsBalance(0, matthew.address)).to.eq(0)
      expect(await lockups.getBalance(0, matthew.address)).to.eq(0)
      expect(await lockups.getYield(0, matthew.address)).to.eq(0)
      expect(await lockups.getDelegate(0, matthew.address)).to.eq(
        ethers.constants.AddressZero
      )

      expect(await eco.voteBalanceOf(matthew.address)).to.eq(0)
      expect(await eco.voteBalanceOf(dave.address)).to.eq(
        depositAmount.add(interest)
      )
    })

    it('lets two people withdraw their own stuff as expected', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(bob.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(3))

      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)

      expect(await lockups.getGonsBalance(0, bob.address)).to.eq(gons)
      expect(await lockups.getBalance(0, bob.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, bob.address)).to.eq(interest)

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount.add(interest).mul(inflationMultiplier)
        )

      await expect(lockups.connect(bob).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          bob.address,
          depositAmount.add(interest).mul(inflationMultiplier)
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(bob.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)

      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)

      expect(await lockups.getGonsBalance(0, bob.address)).to.eq(0)
      expect(await lockups.getBalance(0, bob.address)).to.eq(0)
      expect(await lockups.getYield(0, bob.address)).to.eq(0)
    })
  })

  describe('sweep', async () => {
    beforeEach(async () => {
      await lockups.connect(alice).createLockup(goodDuration, goodRate)
      await time.increase(Number(await lockups.depositWindow()) / 2)
      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(await lockups.currentInflationMultiplier())
      interest = depositAmount.mul(goodRate).div(BASE)

      await eco.connect(alice).approve(lockups.address, depositAmount)
      await eco.connect(bob).approve(lockups.address, depositAmount)
    })
    it('sweeps one penalty', async () => {
      expect(await eco.balanceOf(policyImpersonator.address)).to.eq(0)
      await lockups.connect(alice).deposit(0, depositAmount)
      await lockups.connect(alice).withdraw(0)
      await lockups
        .connect(policyImpersonator)
        .sweep(policyImpersonator.address)
      expect(await eco.balanceOf(policyImpersonator.address)).to.eq(interest)
    })
    it('sweeps multiple penalties', async () => {
      expect(await eco.balanceOf(policyImpersonator.address)).to.eq(0)
      await lockups.connect(alice).deposit(0, depositAmount)
      await lockups.connect(bob).deposit(0, depositAmount)
      await lockups.connect(alice).withdraw(0)
      await lockups.connect(bob).withdraw(0)
      await lockups
        .connect(policyImpersonator)
        .sweep(policyImpersonator.address)
      expect(await eco.balanceOf(policyImpersonator.address)).to.eq(
        interest.mul(2)
      )
    })
  })
})
