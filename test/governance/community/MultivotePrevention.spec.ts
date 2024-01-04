import { ethers } from 'hardhat'
import { expect } from 'chai'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { deploy } from '../../../deploy/utils'
import { Policy } from '../../../typechain-types/contracts/policy'
import { ECO } from '../../../typechain-types/contracts/currency'
import {
  CommunityGovernance,
  ECOxStaking,
} from '../../../typechain-types/contracts/governance/community'
import {
  InfiniteVote,
  SampleProposal,
} from '../../../typechain-types/contracts/test'
import { ECO__factory } from '../../../typechain-types/factories/contracts/currency'
import {
  CommunityGovernance__factory,
  ECOxStaking__factory,
} from '../../../typechain-types/factories/contracts/governance/community'
import {
  InfiniteVote__factory,
  SampleProposal__factory,
} from '../../../typechain-types/factories/contracts/test'
import { BigNumber } from 'ethers'

const A1 = '0x1111111111111111111111111111111111111111'
const A2 = '0x2222222222222222222222222222222222222222'
const INIT_BALANCE = 20000
const INIT_BIG_BALANCE = 1000000
const NUM_SUBVOTERS = 16

describe('Community Governance', () => {
  let policyImpersonator: SignerWithAddress
  let alice: SignerWithAddress
  let bigboy: SignerWithAddress
  before(async () => {
    ;[policyImpersonator, alice, bigboy] = await ethers.getSigners()
  })
  let policy: FakeContract<Policy>
  let eco: MockContract<ECO>
  let ecoXStaking: MockContract<ECOxStaking>
  let exploitContract: InfiniteVote
  let proposal: SampleProposal

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
    await eco.connect(policyImpersonator).updateMinters(policy.address, true)
    await eco.connect(alice).enableVoting()
    await eco.connect(policyImpersonator).mint(alice.address, INIT_BALANCE)
    await eco.connect(bigboy).enableVoting()
    await eco.connect(policyImpersonator).mint(bigboy.address, INIT_BIG_BALANCE)

    ecoXStaking = await (
      await smock.mock<ECOxStaking__factory>(
        'contracts/governance/community/ECOxStaking.sol:ECOxStaking'
      )
    ).deploy(
      policy.address,
      A2 // ECOx
    )

    const currentStageEnd = BigNumber.from(await time.latest())

    cg = await (
      await smock.mock<CommunityGovernance__factory>(
        'contracts/governance/community/CommunityGovernance.sol:CommunityGovernance'
      )
    ).deploy(
      policy.address,
      eco.address,
      ecoXStaking.address,
      currentStageEnd,
      A1 // pauser
    )

    proposal = (await deploy(alice, SampleProposal__factory)) as SampleProposal
    exploitContract = (await deploy(alice, InfiniteVote__factory, [
      NUM_SUBVOTERS,
      cg.address,
      eco.address,
      proposal.address,
    ])) as InfiniteVote

    await eco.connect(policyImpersonator).updateSnapshotters(cg.address, true)
  })

  it('attempt to multivote', async () => {
    // this setup more realistically sets up a governance cycle
    await time.increase(await cg.PROPOSAL_LENGTH())
    await cg.updateStage()
    await time.increaseTo((await cg.currentStageEnd()).add(1))
    await eco.connect(alice).transfer(exploitContract.address, INIT_BALANCE)
    await expect(exploitContract.infiniteVote()).to.be.reverted

    expect((await cg.proposals(proposal.address)).totalSupport).to.eq(0)

    // /**
    //  * several guards prevent getting to this state
    //  * ECOxStaking simply cannot be forced to fetch voting power for the current block, so the voting power calculation fails
    //  * additionally community governance disallows supporting when the total voting power is zero
    //  * however even if these checks are disabled, we see that no voting power is allocated to the multivoting procedure
    //  * this is because the previous snapshot for each subvoter is used during the block of the snapshot where it doesn't have any voting power
    //  * only when a snapshot is allowed to be made for each subvoter during the snapshot block is the below possible
    // */

    // const contractBalance = await eco.balanceOf(exploitContract.address)
    // const contractVoteBalance = await eco.voteBalanceOf(exploitContract.address)
    // expect(contractBalance).to.eq(contractVoteBalance)
    // expect(contractVoteBalance).to.eq(BigNumber.from(INIT_BALANCE).sub(await cg.proposalFee()))
    // expect((await cg.proposals(proposal.address)).totalSupport).to.eq(contractVoteBalance.mul(NUM_SUBVOTERS))
    // expect(await cg.totalEnactVotes()).to.be.gte((await cg.cycleTotalVotingPower()).div(2)) // more enact votes than required for instant enaction
    // expect(await cg.stage()).to.eq(4) // execution
    // await cg.execute() // this could be done atomically in the multivoter, but it's better done here
  })

  it('TODO: test to prove this also fixes flash loaning', async () => {})
})
