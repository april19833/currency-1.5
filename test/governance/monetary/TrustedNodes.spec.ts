/* eslint-disable camelcase */
import { ethers } from 'hardhat'
import { constants } from 'ethers'
import {
  smock,
  FakeContract,
  MockContract,
  MockContractFactory,
} from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'

import { getABI } from '../../utils/testUtils'
import {
  TrustedNodes,
  TrustedNodes__factory,
  Policy,
  ECOx,
  ECOx__factory,
  CurrencyGovernance,
} from '../../../typechain-types'

describe('TrustedNodes', () => {
  let policyImpersonator: SignerWithAddress
  let currencyGovernanceImpersonator: SignerWithAddress

  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress
  let dave: SignerWithAddress

  const trustedNodesABI = getABI(
    'artifacts/contracts/governance/monetary/TrustedNodes.sol/TrustedNodes.json'
  )

  const initialReward: number = 100
  const initialTermLength: number = 3600 * 24

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

  const trustedNodesFactory = new TrustedNodes__factory(
    trustedNodesABI.abi,
    trustedNodesABI.bytecode
  )
  let trustedNodes: TrustedNodes
  let ecoX: MockContract<ECOx>

  beforeEach(async () => {
    policy = await smock.fake<Policy>(
      'Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )
    currencyGovernance = await smock.fake<CurrencyGovernance>(
      'CurrencyGovernance',
      { address: currencyGovernanceImpersonator.address }
    )
    const ecoXFactory: MockContractFactory<ECOx__factory> = await smock.mock(
      'ECOx'
    )
    ecoX = await ecoXFactory.deploy(
      policy.address,
      policy.address,
      1000,
      policy.address,
      policyImpersonator.address
    )

    trustedNodes = await trustedNodesFactory
      .connect(policyImpersonator)
      .deploy(
        policy.address,
        currencyGovernance.address,
        ecoX.address,
        initialTermLength,
        initialReward,
        [alice.address, bob.address]
      )

    await ecoX.mint(trustedNodes.address, 1000)
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
      ).to.be.revertedWith('Only the policy contract may call this method')
      await expect(
        trustedNodes.connect(alice).distrust(bob.address)
      ).to.be.revertedWith('Only the policy contract may call this method')
      await expect(
        trustedNodes
          .connect(alice)
          .updateCurrencyGovernance(constants.AddressZero)
      ).to.be.revertedWith('Only the policy contract may call this method')
      await expect(
        trustedNodes.connect(alice).sweep(alice.address)
      ).to.be.revertedWith('Only the policy contract may call this method')
    })
    it("doesn't allow non-currencyGovernance role to record a vote", async () => {
      await expect(
        trustedNodes.connect(alice).recordVote(alice.address)
      ).to.be.revertedWith(
        'only the currencyGovernance holder may call this method'
      )
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
      ).to.be.revertedWith('Node already trusted')
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
      ).to.be.revertedWith('Node already not trusted')
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
        (await trustedNodes.termEnd()).toNumber() +
          4 * (await trustedNodes.GENERATION_TIME())
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
        (await trustedNodes.termEnd()).toNumber() +
          1 * (await trustedNodes.GENERATION_TIME())
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
        (await trustedNodes.termEnd()).toNumber() +
          2 * (await trustedNodes.GENERATION_TIME())
      )
    })
  })

  describe('withdraw', async () => {
    it('reverts when withdrawing 0', async () => {
      await expect(trustedNodes.connect(alice).withdraw()).to.be.revertedWith(
        'You have not vested any tokens'
      )
    })
    it('allows correct withdrawal in simple case', async () => {
      await trustedNodes
        .connect(currencyGovernanceImpersonator)
        .recordVote(alice.address)
      await time.increaseTo(
        (await trustedNodes.termEnd()).toNumber() +
          1 * (await trustedNodes.GENERATION_TIME())
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
        (await trustedNodes.termEnd()).toNumber() +
          5 * (await trustedNodes.GENERATION_TIME())
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
        (await trustedNodes.termEnd()).toNumber() +
          1 * (await trustedNodes.GENERATION_TIME())
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
        (await trustedNodes.termEnd()).toNumber() +
          1 * (await trustedNodes.GENERATION_TIME())
      )

      await trustedNodes.connect(alice).withdraw()
      expect(await ecoX.balanceOf(alice.address)).to.eq(initialReward)
      // another one
      await expect(trustedNodes.connect(alice).withdraw()).to.be.revertedWith(
        'You have not vested any tokens'
      )
    })
  })
  describe('sweep', async () => {
    it('works', async () => {
      expect(await ecoX.balanceOf(alice.address)).to.eq(0)
      await trustedNodes.connect(policyImpersonator).sweep(alice.address)
      expect(await ecoX.balanceOf(alice.address)).to.eq(1000)
    })
  })
})
