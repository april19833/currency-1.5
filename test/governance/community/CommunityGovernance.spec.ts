import { ethers } from 'hardhat'
// import { constants } from 'ethers'
import { expect } from 'chai'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
// import { time } from '@nomicfoundation/hardhat-network-helpers'
// import { DAY } from '../../utils/constants'
import { ERRORS } from '../../utils/errors'
import {
  CommunityGovernance,
  CommunityGovernance__factory,
  Policy,
  ECO,
  ECO__factory,
  ECOxStaking,
  ECOxStaking__factory,
} from '../../../typechain-types'

const PLACEHOLDER_ADDRESS1 = '0x1111111111111111111111111111111111111111'
const PLACEHOLDER_ADDRESS2 = '0x2222222222222222222222222222222222222222'
const INITIAL_SUPPLY = ethers.utils.parseEther('100')

describe('Community Governance', () => {
  let policyImpersonator: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  before(async () => {
    ;[policyImpersonator, alice, bob] = await ethers.getSigners()
  })
  let policy: FakeContract<Policy>
  let eco: MockContract<ECO>
  let ecoXStaking: MockContract<ECOxStaking>

  let communityGovernance: CommunityGovernance

  beforeEach(async () => {
    policy = await smock.fake<Policy>(
      'Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )
    eco = await (
      await smock.mock<ECO__factory>('ECO')
    ).deploy(
      policy.address,
      PLACEHOLDER_ADDRESS1, // distributor - can we take this variable out?
      INITIAL_SUPPLY, // initialSupply - can we take this variable out?
      alice.address // pauser
    )

    ecoXStaking = await (
      await smock.mock<ECOxStaking__factory>('ECOxStaking')
    ).deploy(
      policy.address,
      PLACEHOLDER_ADDRESS2 // ECOx
    )

    communityGovernance = await new CommunityGovernance__factory()
      .connect(policyImpersonator)
      .deploy(
        policy.address,
        eco.address,
        ecoXStaking.address,
        alice.address // pauser
      )
    await eco
      .connect(policyImpersonator)
      .updateSnapshotters(communityGovernance.address, true)
  })

  it('Constructs', async () => {
    expect(await communityGovernance.policy()).to.eq(policy.address)
    expect(await communityGovernance.ecoToken()).to.eq(eco.address)
    expect(await communityGovernance.ecoXStaking()).to.eq(ecoXStaking.address)
    expect(await communityGovernance.pauser()).to.eq(alice.address)
  })
  describe('permissions', () => {
    it('only lets Policy set pauser', async () => {
      expect(await communityGovernance.pauser()).to.eq(alice.address)
      await expect(
        communityGovernance.connect(alice).setPauser(bob.address)
      ).to.be.revertedWith(ERRORS.Policed.POLICY_ONLY)
      expect(await communityGovernance.pauser()).to.eq(alice.address)
      await expect(
        communityGovernance
          .connect(policyImpersonator)
          .setPauser(policyImpersonator.address)
      )
        .to.emit(communityGovernance, 'PauserAssignment')
        .withArgs(policyImpersonator.address)
      expect(await communityGovernance.pauser()).to.eq(
        policyImpersonator.address
      )
    })
  })
})
