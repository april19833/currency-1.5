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
import { execPath } from 'process'

describe('Lockups', () => {
  let policyImpersonator: SignerWithAddress

  let eco: MockContract<ECO>

  let policy: FakeContract<Policy>

  let lockups: Lockups

  let alice: SignerWithAddress

  let bob: SignerWithAddress

  let charlie: SignerWithAddress

  let dave: SignerWithAddress

  const depositWindow = 600

  const goodDuration = 3600 * 24 * 60

  // 10%
  const goodRate = '100000000000000000'

  before(async () => {
    ;[
      policyImpersonator,
      alice,
      bob,
      charlie,
      dave,
    ] = await ethers.getSigners()
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
    await eco.setVariable('inflationMultiplier', '1000000000000000000')
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
    expect(await lockups.currentInflationMultiplier()).to.eq(
      '1000000000000000000'
    )
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
      await eco.connect(alice).approve(lockups.address, 10000)
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
    it('does single deposit correctly', async () => {
      expect(await eco.getPrimaryDelegate(alice.address)).to.eq(charlie.address)
      const gons = (await lockups.currentInflationMultiplier()).mul(10000)
      await expect(
        lockups.connect(alice).deposit(0, 10000)
      )
        .to.emit(eco, 'DelegatedVotes')
        .withArgs(lockups.address, charlie.address, 10000)
      // expect(await lockups.lockups(0).gonsBalances[alice.address]).to.eq(gons)
      expect(await lockups.getBalance(0, alice.address)).to.eq(10000)
    })
  })
})
