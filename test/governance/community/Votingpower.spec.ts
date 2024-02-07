import { ethers } from 'hardhat'
import { expect, use } from 'chai'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { ERRORS } from '../../utils/errors'
import { Policy } from '../../../typechain-types/contracts/policy'
import { ECO, ECOx } from '../../../typechain-types/contracts/currency'
import {
  CommunityGovernance,
  ECOxStaking,
} from '../../../typechain-types/contracts/governance/community'
import {
  ECO__factory,
  ECOx__factory,
} from '../../../typechain-types/factories/contracts/currency'
import {
  CommunityGovernance__factory,
  ECOxStaking__factory,
} from '../../../typechain-types/factories/contracts/governance/community'

use(smock.matchers)

const INIT_BALANCE1 = 10000
const INIT_BALANCE2 = 20000

async function advanceCycle(
  signer: SignerWithAddress,
  cg: MockContract<CommunityGovernance>
) {
  await time.increase((await cg.CYCLE_LENGTH()).add(1))
  await cg.connect(signer).updateStage()
}

describe('Voting Power', () => {
  let policyImpersonator: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  before(async () => {
    ;[policyImpersonator, alice, bob] = await ethers.getSigners()
  })
  let policy: FakeContract<Policy>
  let eco: MockContract<ECO>
  let ecox: MockContract<ECOx>
  let ecoXStaking: MockContract<ECOxStaking>
  let currentStageEnd: Number

  let cg: MockContract<CommunityGovernance>

  beforeEach(async () => {
    policy = await smock.fake<Policy>(
      'contracts/policy/Policy.sol:Policy',
      { address: policyImpersonator.address } // This allows us to use an ethers override {from: Fake__Policy.address} to mock calls
    )

    eco = await (
      await smock.mock<ECO__factory>('contracts/currency/ECO.sol:ECO')
    ).deploy(
      policy.address,
      alice.address // pauser
    )
    ecox = await (
      await smock.mock<ECOx__factory>('contracts/currency/ECOx.sol:ECOx')
    ).deploy(
      policy.address,
      alice.address // pauser
    )

    ecoXStaking = await (
      await smock.mock<ECOxStaking__factory>(
        'contracts/governance/community/ECOxStaking.sol:ECOxStaking'
      )
    ).deploy(policy.address, ecox.address)

    currentStageEnd = await time.latest()

    cg = await (
      await smock.mock<CommunityGovernance__factory>(
        'contracts/governance/community/CommunityGovernance.sol:CommunityGovernance'
      )
    ).deploy(
      policy.address,
      eco.address,
      ecox.address,
      ecoXStaking.address,
      currentStageEnd,
      alice.address // pauser
    )

    await eco.connect(policyImpersonator).updateMinters(policy.address, true)
    await ecox.connect(policyImpersonator).updateMinters(policy.address, true)

    await eco.connect(policyImpersonator).mint(alice.address, INIT_BALANCE1)
    await ecox.connect(policyImpersonator).mint(alice.address, INIT_BALANCE2)
    await eco.connect(policyImpersonator).mint(bob.address, INIT_BALANCE2)
    await ecox.connect(policyImpersonator).mint(bob.address, INIT_BALANCE1)

    await eco.connect(alice).enableVoting()
    await eco.connect(bob).enableVoting()

    await ecox
      .connect(alice)
      .approve(ecoXStaking.address, await ecox.balanceOf(alice.address))
    await ecox
      .connect(bob)
      .approve(ecoXStaking.address, await ecox.balanceOf(bob.address))

    await eco.connect(policyImpersonator).updateSnapshotters(cg.address, true)
    await ecox.connect(policyImpersonator).updateSnapshotters(cg.address, true)

    await advanceCycle(policyImpersonator, cg)
  })

  it('doesnt let you fetch voting power during snapshot block', async () => {
    await expect(cg.totalVotingPower()).to.be.revertedWith(
      ERRORS.VOTINGPOWER.NO_ATOMIC
    )
    await expect(cg.votingPower(alice.address)).to.be.revertedWith(
      ERRORS.VOTINGPOWER.NO_ATOMIC
    )
  })

  it('totalVotingPower returns correct value', async () => {
    await time.increase(1)
    const totalEco = await eco.totalSupply()
    const totalEcoX = await ecox.totalSupply()

    expect(await cg.totalVotingPower()).to.eq(totalEcoX.mul(10).add(totalEco))
  })

  it('votingPower returns correct value', async () => {
    await ecoXStaking
      .connect(alice)
      .deposit(await ecox.balanceOf(alice.address))
    await ecoXStaking.connect(bob).deposit(await ecox.balanceOf(bob.address))

    await advanceCycle(policyImpersonator, cg)
    await time.increase(1)

    const aliceEco = await eco.balanceOf(alice.address)
    const bobEco = await eco.balanceOf(bob.address)
    const aliceEcoX = await ecoXStaking.balanceOf(alice.address)
    const bobEcoX = await ecoXStaking.balanceOf(bob.address)
    expect(await cg.votingPower(alice.address)).to.eq(
      aliceEcoX.mul(10).add(aliceEco)
    )
    expect(await cg.votingPower(bob.address)).to.eq(bobEcoX.mul(10).add(bobEco))
  })
})
