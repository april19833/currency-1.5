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
import { DAY } from '../../utils/constants'
import { deploy } from '../../../deploy/utils'
import { Policy } from '../../../typechain-types/contracts/policy'
import {
  CurrencyGovernance,
  TrustedNodes,
} from '../../../typechain-types/contracts/governance/monetary'
import { ECOx } from '../../../typechain-types/contracts/currency'
import { ECOx__factory } from '../../../typechain-types/factories/contracts/currency'
import { TrustedNodes__factory } from '../../../typechain-types/factories/contracts/governance/monetary'

describe('TrustedNodes', () => {
  let policyImpersonator: SignerWithAddress
  let currencyGovernanceImpersonator: SignerWithAddress

  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress
  let dave: SignerWithAddress

  const initialReward: number = 100
  const initialTermLength: number = 1 * DAY

  before(async () => {
    ;[
      policyImpersonator,
      currencyGovernanceImpersonator,
      alice,
      bob,
      charlie,
      dave,
    ] = await ethers.getSigners()
  })

  let policy: FakeContract<Policy>
  let currencyGovernance: FakeContract<CurrencyGovernance>

  let trustedNodes: TrustedNodes
  let ecoX: MockContract<ECOx>

  beforeEach(async () => {
    policy = await smock.fake<Policy>(
      'contracts/policy/Policy.sol:Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )
    currencyGovernance = await smock.fake<CurrencyGovernance>(
      'contracts/governance/monetary/CurrencyGovernance.sol:CurrencyGovernance',
      { address: currencyGovernanceImpersonator.address }
    )

    const ecoXFactory: MockContractFactory<ECOx__factory> = await smock.mock(
      'contracts/currency/ECOx.sol:ECOx'
    )
    ecoX = await ecoXFactory.deploy(policy.address, policy.address)

    trustedNodes = (await deploy(policyImpersonator, TrustedNodes__factory, [
      policy.address,
      currencyGovernance.address,
      ecoX.address,
      initialTermLength,
      initialReward,
      [alice.address, bob.address],
    ])) as TrustedNodes

    await ecoX.setVariable(`_balances`, { [trustedNodes.address]: 1000 })
  })

  describe('constructor', async () => {
    it('works', async () => {
      expect(await trustedNodes.policy()).to.eq(policy.address)
      expect(await trustedNodes.currencyGovernance()).to.eq(
        currencyGovernance.address
      )
      expect(await trustedNodes.ecoX()).to.eq(ecoX.address)
      expect(await trustedNodes.termLength()).to.eq(3600 * 24)
      expect(await trustedNodes.voteReward()).to.eq(initialReward)

      expect(await trustedNodes.numTrustees()).to.eq(2)
      expect(await trustedNodes.trustees(0)).to.eq(alice.address)
      expect(await trustedNodes.trustees(1)).to.eq(bob.address)
      expect(await trustedNodes.trusteeNumbers(alice.address)).to.eq(1)
      expect(await trustedNodes.trusteeNumbers(bob.address)).to.eq(2)
    })
  })
  describe('permissions', async () => {
    it("doesn't allow non-policy address to trust, distrust, change the currencyGovernance role, or sweep funds", async () => {
      await expect(
        trustedNodes.connect(alice).trust(charlie.address)
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      await expect(
        trustedNodes.connect(alice).distrust(bob.address)
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      await expect(
        trustedNodes
          .connect(alice)
          .updateCurrencyGovernance(constants.AddressZero)
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      await expect(
        trustedNodes.connect(alice).sweep(alice.address, 1)
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    })
    it("doesn't allow non-currencyGovernance role to record a vote", async () => {
      await expect(
        trustedNodes.connect(alice).recordVote(alice.address)
      ).to.be.revertedWith(ERRORS.TrustedNodes.CG_ONLY)
    })
  })

  describe('trust', async () => {
    it('trusts address successfully', async () => {
      expect(await trustedNodes.numTrustees()).to.eq(2)
      await expect(
        trustedNodes.connect(policyImpersonator).trust(charlie.address)
      )
        .to.emit(trustedNodes, 'TrustedNodeAddition')
        .withArgs(charlie.address)
      expect(await trustedNodes.numTrustees()).to.eq(3)
      expect(await trustedNodes.trustees(2)).to.eq(charlie.address)
      expect(await trustedNodes.trusteeNumbers(charlie.address)).to.eq(3)
    })
    it('doesnt allow trusting already trusted addresses', async () => {
      await expect(
        trustedNodes.connect(policyImpersonator).trust(alice.address)
      ).to.be.revertedWith(ERRORS.TrustedNodes.DUPLICATE_TRUST)
    })
  })

  describe('distrust', async () => {
    it('distrusts address successfully', async () => {
      expect(await trustedNodes.numTrustees()).to.eq(2)
      expect(await trustedNodes.trustees(0)).to.eq(alice.address)
      expect(await trustedNodes.trustees(1)).to.eq(bob.address)

      await expect(
        trustedNodes.connect(policyImpersonator).distrust(alice.address)
      )
        .to.emit(trustedNodes, 'TrustedNodeRemoval')
        .withArgs(alice.address)

      expect(await trustedNodes.numTrustees()).to.eq(1)
      expect(await trustedNodes.trustees(0)).to.eq(bob.address)
      expect(await trustedNodes.trusteeNumbers(bob.address)).to.eq(1)
    })
    it('doesnt allow distrusting already not trusted addresses', async () => {
      await expect(
        trustedNodes.connect(policyImpersonator).distrust(charlie.address)
      ).to.be.revertedWith(ERRORS.TrustedNodes.DUPLICATE_DISTRUST)
    })
  })

  describe('isTrusted', async () => {
    it('works', async () => {
      expect(await trustedNodes.isTrusted(alice.address)).to.be.true
      expect(await trustedNodes.isTrusted(charlie.address)).to.be.false
    })
  })

  describe('updateCurrencyGovernance', async () => {
    it('works', async () => {
      expect(await trustedNodes.currencyGovernance()).to.eq(
        currencyGovernance.address
      )
      await expect(
        await trustedNodes
          .connect(policyImpersonator)
          .updateCurrencyGovernance(dave.address)
      )
        .to.emit(trustedNodes, 'CurrencyGovernanceChanged')
        .withArgs(dave.address)
      expect(await trustedNodes.currencyGovernance()).to.eq(dave.address)
    })
  })

  describe('recordVote', async () => {
    it('works', async () => {
      expect(await trustedNodes.votingRecord(alice.address)).to.eq(0)
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      expect(await trustedNodes.votingRecord(alice.address)).to.eq(1)
    })
    it('allows for recording votes when being added later', async () => {
      await trustedNodes.connect(policyImpersonator).trust(charlie.address)
      expect(await trustedNodes.votingRecord(charlie.address)).to.eq(0)
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(charlie.address)
      expect(await trustedNodes.votingRecord(charlie.address)).to.eq(1)
    })
  })

  describe('currentlyWithdrawable', async () => {
    it('displays the correct amount when voting record is limiting factor', async () => {
      trustedNodes.connect(alice)
      expect(await trustedNodes.currentlyWithdrawable()).to.eq(0)
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address) // voted twice
      expect(await trustedNodes.votingRecord(alice.address)).to.eq(2)

      await time.increaseTo(
        (
          await trustedNodes.termEnd()
        ).add((await trustedNodes.GENERATION_TIME()).mul(4))
      ) // at this time you'd be able to withdraw 4 rewards
      expect(await trustedNodes.connect(alice).currentlyWithdrawable()).to.eq(
        2 * initialReward
      )
    })
    it('displays the correct amount when time of withdrawal is limiting factor', async () => {
      trustedNodes.connect(alice)
      expect(await trustedNodes.currentlyWithdrawable()).to.eq(0)
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address) // voted twice
      expect(await trustedNodes.votingRecord(alice.address)).to.eq(2)

      await time.increaseTo(
        (await trustedNodes.termEnd()).add(await trustedNodes.GENERATION_TIME())
      ) // at this time you'd be able to withdraw 4 rewards
      expect(await trustedNodes.connect(alice).currentlyWithdrawable()).to.eq(
        1 * initialReward
      )
    })
  })

  describe('fullyVested', async () => {
    it('works', async () => {
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address) // voted twice
      const data = await trustedNodes.connect(alice.address).fullyVested()
      expect(data[0]).to.eq(2 * initialReward)
      expect(data[1]).to.eq(
        (await trustedNodes.termEnd()).add(
          (await trustedNodes.GENERATION_TIME()).mul(2)
        )
      )
    })
  })

  describe('withdraw', async () => {
    it('reverts when withdrawing 0', async () => {
      await expect(trustedNodes.connect(alice).withdraw()).to.be.revertedWith(
        ERRORS.TrustedNodes.EMPTY_WITHDRAW
      )
    })
    it('allows correct withdrawal in simple case', async () => {
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await time.increaseTo(
        (await trustedNodes.termEnd()).add(await trustedNodes.GENERATION_TIME())
      ) // at this time you'd be able to withdraw 4 rewards

      await expect(trustedNodes.connect(alice).withdraw())
        .to.emit(trustedNodes, 'VotingRewardRedemption')
        .withArgs(alice.address, initialReward)
      expect(await ecoX.balanceOf(alice.address)).to.eq(initialReward)
    })
    it('allows correct withdrawal when voting record is limiting factor', async () => {
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await time.increaseTo(
        (
          await trustedNodes.termEnd()
        ).add((await trustedNodes.GENERATION_TIME()).mul(5))
      )

      await trustedNodes.connect(alice).withdraw()
      expect(await ecoX.balanceOf(alice.address)).to.eq(initialReward)
    })

    it('allows correct withdrawal when trustee is distrusted', async () => {
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await trustedNodes.connect(policyImpersonator).distrust(alice.address)
      await time.increaseTo(
        (
          await trustedNodes.termEnd()
        ).add((await trustedNodes.GENERATION_TIME()).mul(5))
      )

      await trustedNodes.connect(alice).withdraw()
      expect(await ecoX.balanceOf(alice.address)).to.eq(initialReward)
    })

    it('allows correct withdrawal when withdrawal time is limiting factor', async () => {
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await time.increaseTo(
        (await trustedNodes.termEnd()).add(await trustedNodes.GENERATION_TIME())
      )

      await trustedNodes.connect(alice).withdraw()
      expect(await ecoX.balanceOf(alice.address)).to.eq(initialReward)
    })
    it('withdrawing immediately again does not bypass withdrawal time restrictions', async () => {
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await time.increaseTo(
        (await trustedNodes.termEnd()).add(await trustedNodes.GENERATION_TIME())
      )

      await trustedNodes.connect(alice).withdraw()
      expect(await ecoX.balanceOf(alice.address)).to.eq(initialReward)
      // another one
      await expect(trustedNodes.connect(alice).withdraw()).to.be.revertedWith(
        ERRORS.TrustedNodes.EMPTY_WITHDRAW
      )
    })
  })
  describe('sweep', async () => {
    it('works', async () => {
      expect(await ecoX.balanceOf(alice.address)).to.eq(0)
      await trustedNodes.connect(policyImpersonator).sweep(alice.address, 123)
      expect(await ecoX.balanceOf(alice.address)).to.eq(123)
    })
    it('doesnt work when amount is higher than balance', async () => {
      expect(await ecoX.balanceOf(alice.address)).to.eq(0)
      await expect(
        trustedNodes
          .connect(policyImpersonator)
          .sweep(
            alice.address,
            (await ecoX.balanceOf(trustedNodes.address)).add(1)
          )
      ).to.be.reverted
      expect(await ecoX.balanceOf(alice.address)).to.eq(0)
    })
  })
})
