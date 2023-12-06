import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Fixture, testnetFixture } from '../../../deploy/standalone.fixture'
import { DAY } from '../../utils/constants'
import { Contract } from 'ethers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { BurnerProposal__factory, MinterProposal__factory, RebaserProposal__factory, SnapshotterProposal__factory, UpdateECOxExchangeProposal__factory } from '../../../typechain-types/factories/contracts/test/E2eTestContracts.sol'
import { deploy } from '../../../deploy/utils'

const INITIAL_SUPPLY = ethers.utils.parseUnits('30000', 'ether')

describe('Policy Integration Tests', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress

  let contracts: Fixture

  const passProposal = async (proposal: Contract) => {
    if (!(await contracts.base.eco.voter(alice.address))) {
      await contracts.base.eco.connect(alice).enableVoting()
    }

    // go to next voting cycle
    await time.increase(14 * DAY)
    // update stage to Done
    await contracts.community.communityGovernance.updateStage()

    // push to next cycle which snapshots alice's new voting power
    await contracts.community.communityGovernance.updateStage()

    // push the proposal through voting
    await contracts.base.eco
      .connect(alice)
      .approve(
        contracts.community.communityGovernance.address,
        await contracts.community.communityGovernance.proposalFee()
      )
    await contracts.community.communityGovernance
      .connect(alice)
      .propose(proposal.address)
    await contracts.community.communityGovernance
      .connect(alice)
      .support(proposal.address)
    await contracts.community.communityGovernance
      .connect(alice)
      .vote(1)
    await contracts.community.communityGovernance
      .connect(alice)
      .execute()
  }

  before(async () => {
    ;[alice, bob, charlie] = await ethers.getSigners()
  })


  beforeEach(async () => {
    contracts = await testnetFixture(
      [bob.address, charlie.address],
      alice.address,
      INITIAL_SUPPLY.toString(),
      INITIAL_SUPPLY.toString(),
      false,
      { trusteeTerm: 28 * DAY }
    )
  })

  it('add a minter', async () => {
    expect(await contracts.base.eco.minters(alice.address)).to.be.false
    const proposal1 = await deploy(alice, MinterProposal__factory, [contracts.base.eco.address, alice.address, true])
    await passProposal(proposal1)
    expect(await contracts.base.eco.minters(alice.address)).to.be.true

    expect(await contracts.base.ecox.minters(alice.address)).to.be.false
    const proposal2 = await deploy(alice, MinterProposal__factory, [contracts.base.ecox.address, alice.address, true])
    await passProposal(proposal2)
    expect(await contracts.base.ecox.minters(alice.address)).to.be.true
  })

  it('remove a minter', async () => {
    expect(await contracts.base.eco.minters(contracts.monetary.lockupsLever.address)).to.be.true
    const proposal1 = await deploy(alice, MinterProposal__factory, [contracts.base.eco.address, contracts.monetary.lockupsLever.address, false])
    await passProposal(proposal1)
    expect(await contracts.base.eco.minters(contracts.monetary.lockupsLever.address)).to.be.false

    expect(await contracts.base.eco.minters(contracts.base.ecoXExchange.address)).to.be.true
    const proposal2 = await deploy(alice, MinterProposal__factory, [contracts.base.eco.address, contracts.base.ecoXExchange.address, false])
    await passProposal(proposal2)
    expect(await contracts.base.eco.minters(contracts.base.ecoXExchange.address)).to.be.false

    const proposal3 = await deploy(alice, MinterProposal__factory, [contracts.base.ecox.address, alice.address, true])
    await passProposal(proposal3)
    expect(await contracts.base.ecox.minters(alice.address)).to.be.true
    const proposal4 = await deploy(alice, MinterProposal__factory, [contracts.base.ecox.address, alice.address, false])
    await passProposal(proposal4)
    expect(await contracts.base.ecox.minters(alice.address)).to.be.false
  })

  it('add a burner', async () => {
    expect(await contracts.base.eco.burners(alice.address)).to.be.false
    const proposal1 = await deploy(alice, BurnerProposal__factory, [contracts.base.eco.address, alice.address, true])
    await passProposal(proposal1)
    expect(await contracts.base.eco.burners(alice.address)).to.be.true

    expect(await contracts.base.ecox.burners(alice.address)).to.be.false
    const proposal2 = await deploy(alice, BurnerProposal__factory, [contracts.base.ecox.address, alice.address, true])
    await passProposal(proposal2)
    expect(await contracts.base.ecox.burners(alice.address)).to.be.true
  })

  it('remove a burner', async () => {
    const proposal1 = await deploy(alice, BurnerProposal__factory, [contracts.base.eco.address, alice.address, true])
    await passProposal(proposal1)
    expect(await contracts.base.eco.burners(alice.address)).to.be.true
    const proposal2 = await deploy(alice, BurnerProposal__factory, [contracts.base.eco.address, alice.address, false])
    await passProposal(proposal2)
    expect(await contracts.base.eco.burners(alice.address)).to.be.false

    const proposal3 = await deploy(alice, BurnerProposal__factory, [contracts.base.ecox.address, alice.address, true])
    await passProposal(proposal3)
    expect(await contracts.base.ecox.burners(alice.address)).to.be.true
    const proposal4 = await deploy(alice, BurnerProposal__factory, [contracts.base.ecox.address, alice.address, false])
    await passProposal(proposal4)
    expect(await contracts.base.ecox.burners(alice.address)).to.be.false
  })

  it('add a rebaser', async () => {
    expect(await contracts.base.eco.rebasers(alice.address)).to.be.false
    const proposal1 = await deploy(alice, RebaserProposal__factory, [contracts.base.eco.address, alice.address, true])
    await passProposal(proposal1)
    expect(await contracts.base.eco.rebasers(alice.address)).to.be.true
  })

  it('remove a rebaser', async () => {
    expect(await contracts.base.eco.rebasers(contracts.monetary.rebaseLever.address)).to.be.true
    const proposal1 = await deploy(alice, RebaserProposal__factory, [contracts.base.eco.address, contracts.monetary.rebaseLever.address, false])
    await passProposal(proposal1)
    expect(await contracts.base.eco.rebasers(contracts.monetary.rebaseLever.address)).to.be.false
  })

  it('add a snapshotter', async () => {
    expect(await contracts.base.eco.snapshotters(alice.address)).to.be.false
    const proposal1 = await deploy(alice, SnapshotterProposal__factory, [contracts.base.eco.address, alice.address, true])
    await passProposal(proposal1)
    expect(await contracts.base.eco.snapshotters(alice.address)).to.be.true
  })

  it('remove a snapshotter', async () => {
    expect(await contracts.base.eco.snapshotters(contracts.community.communityGovernance.address)).to.be.true
    const proposal1 = await deploy(alice, SnapshotterProposal__factory, [contracts.base.eco.address, contracts.community.communityGovernance.address, false])
    await passProposal(proposal1)
    expect(await contracts.base.eco.snapshotters(contracts.community.communityGovernance.address)).to.be.false
  })

  it('change ECOxExchange', async () => {
    expect(await contracts.base.ecox.ecoXExchange()).to.eq(contracts.base.ecoXExchange.address)
    const proposal1 = await deploy(alice, UpdateECOxExchangeProposal__factory, [contracts.base.ecox.address, alice.address])
    await passProposal(proposal1)
    expect(await contracts.base.ecox.ecoXExchange()).to.eq(alice.address)
  })
})
