import { ethers } from 'hardhat'
import { smock, FakeContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ERRORS } from '../../utils/errors'
import { deploy } from '../../../deploy/utils'
import { Policy } from '../../../typechain-types/contracts/policy'
import {
  CurrencyGovernance,
  TrustedNodes,
  TrustedNodesFactory,
} from '../../../typechain-types/contracts/governance/monetary'
import { ECOx } from '../../../typechain-types/contracts/currency'
import {
  TrustedNodesFactory__factory,
  TrustedNodes__factory,
} from '../../../typechain-types/factories/contracts/governance/monetary'

describe('TrustedNodesFactory', () => {
  let policyImpersonator: SignerWithAddress
  let currencyGovernanceImpersonator: SignerWithAddress
  let ecoXImpersonator: SignerWithAddress

  let alice: SignerWithAddress
  let bob: SignerWithAddress

  let policy: FakeContract<Policy>
  let currencyGovernance: FakeContract<CurrencyGovernance>
  let ecoX: FakeContract<ECOx>

  const initialReward: number = 100
  const initialTermLength: number = 3600 * 24

  before(async () => {
    ;[
      policyImpersonator,
      currencyGovernanceImpersonator,
      ecoXImpersonator,
      alice,
      bob,
    ] = await ethers.getSigners()
  })

  let trustedNodesFactory: TrustedNodesFactory

  beforeEach(async () => {
    policy = await smock.fake<Policy>(
      'contracts/policy/Policy.sol:Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )
    currencyGovernance = await smock.fake<CurrencyGovernance>(
      'contracts/governance/monetary/CurrencyGovernance.sol:CurrencyGovernance',
      { address: currencyGovernanceImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )
    ecoX = await smock.fake<ECOx>(
      'contracts/currency/ECOx.sol:ECOx',
      { address: ecoXImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )

    trustedNodesFactory = (await deploy(alice, TrustedNodesFactory__factory, [
      policy.address,
      currencyGovernance.address,
      ecoX.address,
    ])) as TrustedNodesFactory
  })

  it('constructs successfully', async () => {
    expect(await trustedNodesFactory.policy()).to.eq(policy.address)
    expect(await trustedNodesFactory.currencyGovernance()).to.eq(
      currencyGovernance.address
    )
    expect(await trustedNodesFactory.ecoX()).to.eq(ecoX.address)
  })

  describe('deploy', async () => {
    it('reverts if called by nonpolicy', async () => {
      await expect(
        trustedNodesFactory.newCohort(initialTermLength, initialReward, [
          alice.address,
          bob.address,
        ])
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
    })

    it('deploys correctly', async () => {
      let newCohortEvents = await trustedNodesFactory.queryFilter(
        trustedNodesFactory.filters.NewCohort()
      )
      expect(newCohortEvents.length).to.eq(0)
      const initialTrustees = [alice.address, bob.address]
      await trustedNodesFactory
        .connect(policyImpersonator)
        .newCohort(initialTermLength, initialReward, initialTrustees)
      newCohortEvents = await trustedNodesFactory.queryFilter(
        trustedNodesFactory.filters.NewCohort()
      )
      expect(newCohortEvents.length).to.eq(1)
      const newTrustedNodes: TrustedNodes = TrustedNodes__factory.connect(
        newCohortEvents[0].args[0],
        alice
      )

      expect(await newTrustedNodes.policy()).to.eq(policy.address)
      expect(await newTrustedNodes.currencyGovernance()).to.eq(
        currencyGovernance.address
      )
      expect(await newTrustedNodes.ecoX()).to.eq(ecoX.address)
      expect(await newTrustedNodes.termLength()).to.eq(initialTermLength)
      expect(await newTrustedNodes.voteReward()).to.eq(initialReward)
      expect(await newTrustedNodes.trustees(0)).to.eq(initialTrustees[0])
      expect(await newTrustedNodes.trustees(1)).to.eq(initialTrustees[1])
    })

    it('only lets policy update currencyGovernance', async () => {
      const cg = await trustedNodesFactory.currencyGovernance()
      await expect(
        trustedNodesFactory.updateCurrencyGovernance(bob.address)
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      await trustedNodesFactory
        .connect(policyImpersonator)
        .updateCurrencyGovernance(bob.address)
      expect(await trustedNodesFactory.currencyGovernance()).to.eq(bob.address)
      expect(await trustedNodesFactory.currencyGovernance()).to.not.eq(cg)
    })
  })
})
