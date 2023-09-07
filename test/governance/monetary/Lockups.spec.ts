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
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { ERRORS } from '../../utils/errors'
import {
  Lockups,
  Policy,
  ECO,
  ECO__factory,
  Lockups__factory,
} from '../../../typechain-types'

describe('Lockups', () => {
  let policyImpersonator: SignerWithAddress

  let eco: MockContract<ECO>

  let policy: FakeContract<Policy>

  let lockups: Lockups

  let alice: SignerWithAddress

  let bob: SignerWithAddress

  let charlie: SignerWithAddress

  let dave: SignerWithAddress

  let depositAmount: any

  let gons: any

  let interest: any

  const depositWindow = 600

  const goodDuration = 3600 * 24 * 60
  // 10%
  const goodRate = '100000000000000000'

  const BASE = '1000000000000000000'

  before(async () => {
    ;[policyImpersonator, alice, bob, charlie, dave] = await ethers.getSigners()
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
    await eco.setVariable('inflationMultiplier', BASE)
    const lockupsFactory = new Lockups__factory()
    lockups = await lockupsFactory.connect(policyImpersonator).deploy(
      policy.address,
      constants.AddressZero, // notifier
      eco.address,
      depositWindow
    )
    await lockups.connect(policyImpersonator).setAuthorized(alice.address, true)

    await eco.mint(alice.address, 10000)
    await eco.mint(bob.address, 10000)
    await eco.connect(charlie).enableDelegationTo()
    await eco.connect(dave).enableDelegationTo()
    await eco.connect(alice).delegate(charlie.address)
    await eco.connect(bob).delegate(dave.address)
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
      const lowDuration = (await lockups.MIN_DURATION()) - 1
      const highDuration = (await lockups.MAX_DURATION()) + 1

      await expect(
        lockups.connect(alice).createLockup(lowDuration, goodRate)
      ).to.be.revertedWith(ERRORS.Lockups.BAD_DURATION)

      await expect(
        lockups.connect(alice).createLockup(highDuration, goodRate)
      ).to.be.revertedWith(ERRORS.Lockups.BAD_DURATION)
    })

    it('doesnt allow rates that are too high', async () => {
      const badRate = (await lockups.MAX_RATE()) + 1
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
    beforeEach(async () => {
      await lockups.connect(alice).createLockup(goodDuration, goodRate)
      await time.increase(Number(await lockups.depositWindow()) / 2)
      await eco.connect(alice).approve(lockups.address, 10000)
      await eco.connect(bob).approve(lockups.address, 10000)
      // const aliceAddress = alice.address
      // const bobAddress = bob.address
      // await eco.setVariables({
      //   '_primaryDelegates': {
      //     aliceAddress: charlie.address,
      //     bobAddress: dave.address,
      //   }
      // })
    })
    it('does not allow late deposit', async () => {
      await time.increase(Number(await lockups.depositWindow()) / 2 + 1)
      await expect(lockups.connect(bob).deposit(1, 1000)).to.be.revertedWith(
        ERRORS.Lockups.LATE_DEPOSIT
      )
    })
    it('does single deposit properly', async () => {
      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(await lockups.currentInflationMultiplier())
      interest = depositAmount.mul(goodRate).div(BASE)
      expect(await eco.getPrimaryDelegate(alice.address)).to.eq(charlie.address)
      expect(await eco.balanceOf(alice.address)).to.eq(10000)
      expect(await eco.balanceOf(lockups.address)).to.eq(0)
      await expect(lockups.connect(alice).deposit(0, 10000))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, 10000)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, alice.address, gons)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(10000)
    })

    it('does additional deposits in the same window properly', async () => {
      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(await lockups.currentInflationMultiplier())
      interest = depositAmount.mul(goodRate).div(BASE)
      await expect(lockups.connect(alice).deposit(0, 4000))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, 4000)
      await expect(lockups.connect(alice).deposit(0, 6000))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, 6000)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(
          0,
          alice.address,
          (await lockups.currentInflationMultiplier()).mul(6000)
        )
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await eco.balanceOf(lockups.address)).to.eq(10000)
    })
    it('works as expected when two users deposit to the same lockup', async () => {
      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(await lockups.currentInflationMultiplier())
      interest = depositAmount.mul(goodRate).div(BASE)
      await expect(lockups.connect(alice).deposit(0, 10000))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, 10000)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, alice.address, gons)
      await expect(lockups.connect(bob).deposit(0, 10000))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, dave.address, 10000)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, bob.address, gons)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await lockups.getGonsBalance(0, bob.address)).to.eq(gons)
      expect(await lockups.getBalance(0, bob.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, bob.address)).to.eq(interest)
      expect(await eco.balanceOf(lockups.address)).to.eq(20000)
    })
    it('works as expected when one users deposit to two different lockups', async () => {
      const otherRate = String(Number(goodRate) * 2)
      await lockups.connect(alice).createLockup(goodDuration, otherRate)
      const d0 = 4000
      const d1 = 6000
      await expect(lockups.connect(alice).deposit(0, d0))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, d0)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(
          0,
          alice.address,
          (await lockups.currentInflationMultiplier()).mul(d0)
        )
      await expect(lockups.connect(alice).deposit(1, d1))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, d1)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(
          1,
          alice.address,
          (await lockups.currentInflationMultiplier()).mul(d1)
        )
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(
        (await lockups.currentInflationMultiplier()).mul(d0)
      )
      expect(await lockups.getBalance(0, alice.address)).to.eq(d0)
      expect(await lockups.getYield(0, alice.address)).to.eq(
        (d0 * Number(goodRate)) / Number(BASE)
      )

      expect(await lockups.getGonsBalance(1, alice.address)).to.eq(
        (await lockups.currentInflationMultiplier()).mul(d1)
      )
      expect(await lockups.getBalance(1, alice.address)).to.eq(d1)
      expect(await lockups.getYield(1, alice.address)).to.eq(
        (d1 * Number(otherRate)) / Number(BASE)
      )
      expect(await eco.balanceOf(lockups.address)).to.eq(10000)
    })
    it('depositsFor', async () => {
      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(await lockups.currentInflationMultiplier())
      interest = depositAmount.mul(goodRate).div(BASE)
      expect(await eco.getPrimaryDelegate(alice.address)).to.eq(charlie.address)
      expect(await eco.balanceOf(alice.address)).to.eq(10000)
      expect(await eco.balanceOf(lockups.address)).to.eq(0)
      await expect(lockups.connect(bob).depositFor(0, alice.address, 10000))
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, 10000)
        .to.emit(lockups, 'LockupDeposit')
        .withArgs(0, alice.address, gons)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(10000)
      expect(await eco.balanceOf(bob.address)).to.eq(10000)
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
    beforeEach(async () => {
      await lockups.connect(alice).createLockup(goodDuration, goodRate)
      await time.increase(Number(await lockups.depositWindow()) / 2)

      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(await lockups.currentInflationMultiplier())
      interest = depositAmount.mul(goodRate).div(BASE)

      await eco.connect(alice).approve(lockups.address, depositAmount)
      await eco.connect(bob).approve(lockups.address, depositAmount)

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
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount
            .sub(interest)
            .mul(await lockups.currentInflationMultiplier())
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.sub(interest)
      )
      expect(await eco.balanceOf(lockups.address)).to.eq(interest)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
    })

    it('penalizes by the same interest amount despite inflationMultiplier changes', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)

      const newInflationMultiplier = (
        await lockups.currentInflationMultiplier()
      ).mul(2)
      await eco.setVariable('inflationMultiplier', newInflationMultiplier)
      await lockups.updateInflationMultiplier()

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount
            .div(2)
            .sub(interest)
            .mul(await lockups.currentInflationMultiplier())
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
    beforeEach(async () => {
      await lockups.connect(alice).createLockup(goodDuration, goodRate)
      await time.increase(Number(await lockups.depositWindow()) / 2)

      depositAmount = await eco.balanceOf(alice.address)
      gons = depositAmount.mul(await lockups.currentInflationMultiplier())
      interest = depositAmount.mul(goodRate).div(BASE)

      await eco.connect(alice).approve(lockups.address, depositAmount)
      await eco.connect(bob).approve(lockups.address, depositAmount)

      await lockups.connect(alice).deposit(0, depositAmount)
      await lockups.connect(bob).deposit(0, depositAmount)
      await time.increaseTo((await lockups.lockups(0)).end.add(1))
    })
    it('withdraws full amount', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(2))

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
          depositAmount
            .add(interest)
            .mul(await lockups.currentInflationMultiplier())
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)

      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)

      expect(await lockups.getGonsBalance(0, bob.address)).to.eq(gons)
      expect(await lockups.getBalance(0, bob.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, bob.address)).to.eq(interest)
    })
    it('doesnt behave unexpectedly if they call withdraw twice', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(2))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount
            .add(interest)
            .mul(await lockups.currentInflationMultiplier())
        )

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(0, alice.address, 0)

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
    })
    it('withdrawsFor properly', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(2))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)

      await expect(lockups.connect(bob).withdrawFor(0, alice.address))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount
            .add(interest)
            .mul(await lockups.currentInflationMultiplier())
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount)
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
    })
    it('works when inflationMultiplier changes', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(2))
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(depositAmount)
      expect(await lockups.getYield(0, alice.address)).to.eq(interest)

      const newInflationMultiplier = (
        await lockups.currentInflationMultiplier()
      ).mul(2)
      await eco.setVariable('inflationMultiplier', newInflationMultiplier)
      await lockups.updateInflationMultiplier()

      await expect(lockups.connect(alice).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          alice.address,
          depositAmount
            .div(2)
            .add(interest)
            .mul(await lockups.currentInflationMultiplier())
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.div(2).add(interest)
      )
      // not sure how to mock eco s.t. i can simply set inflation multipliers
      expect(await lockups.getGonsBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getBalance(0, alice.address)).to.eq(0)
      expect(await lockups.getYield(0, alice.address)).to.eq(0)
    })

    it('lets two people withdraw their own stuff as expected', async () => {
      expect(await eco.balanceOf(alice.address)).to.eq(0)
      expect(await eco.balanceOf(bob.address)).to.eq(0)
      expect(await eco.balanceOf(lockups.address)).to.eq(depositAmount.mul(2))

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
          depositAmount
            .add(interest)
            .mul(await lockups.currentInflationMultiplier())
        )

      await expect(lockups.connect(bob).withdraw(0))
        .to.emit(lockups, 'LockupWithdrawal')
        .withArgs(
          0,
          bob.address,
          depositAmount
            .add(interest)
            .mul(await lockups.currentInflationMultiplier())
        )

      expect(await eco.balanceOf(alice.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(bob.address)).to.eq(
        depositAmount.add(interest)
      )
      expect(await eco.balanceOf(lockups.address)).to.eq(0)

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
