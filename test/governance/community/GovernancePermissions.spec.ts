import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Fixture, testnetFixture } from '../../../deploy/standalone.fixture'
import { DAY } from '../../utils/constants'
import { Contract } from 'ethers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import {
  BurnerProposal__factory,
  MinterProposal__factory,
  RebaserProposal__factory,
  SnapshotterProposal__factory,
  UpdateECOxExchangeProposal__factory,
  UpdateTokenPauserProposal__factory,
  UpdateGovernancePauserProposal__factory,
  SweepGovernanceFeesProposal__factory,
  UpdateGovernanceTrustedNodesProposal__factory,
  UpdateGovernanceEnacterProposal__factory,
  UpdateAdapterGovernanceProposal__factory,
  UpdateLeverNotifierProposal__factory,
  UpdateLeverAuthorizedProposal__factory,
} from '../../../typechain-types/factories/contracts/test/E2eTestContracts.sol'
import { deploy } from '../../../deploy/utils'

const INITIAL_SUPPLY = ethers.utils.parseUnits('30000', 'ether')

describe('Policy E2E Tests', () => {
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
    await contracts.community.communityGovernance.connect(alice).vote(1)
    await contracts.community.communityGovernance.connect(alice).execute()
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
    const proposal1 = await deploy(alice, MinterProposal__factory, [
      contracts.base.eco.address,
      alice.address,
      true,
    ])
    await passProposal(proposal1)
    expect(await contracts.base.eco.minters(alice.address)).to.be.true

    expect(await contracts.base.ecox.minters(alice.address)).to.be.false
    const proposal2 = await deploy(alice, MinterProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      true,
    ])
    await passProposal(proposal2)
    expect(await contracts.base.ecox.minters(alice.address)).to.be.true
  })

  it('remove a minter', async () => {
    expect(
      await contracts.base.eco.minters(contracts.monetary.lockupsLever.address)
    ).to.be.true
    const proposal1 = await deploy(alice, MinterProposal__factory, [
      contracts.base.eco.address,
      contracts.monetary.lockupsLever.address,
      false,
    ])
    await passProposal(proposal1)
    expect(
      await contracts.base.eco.minters(contracts.monetary.lockupsLever.address)
    ).to.be.false

    expect(
      await contracts.base.eco.minters(contracts.base.ecoXExchange.address)
    ).to.be.true
    const proposal2 = await deploy(alice, MinterProposal__factory, [
      contracts.base.eco.address,
      contracts.base.ecoXExchange.address,
      false,
    ])
    await passProposal(proposal2)
    expect(
      await contracts.base.eco.minters(contracts.base.ecoXExchange.address)
    ).to.be.false

    const proposal3 = await deploy(alice, MinterProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      true,
    ])
    await passProposal(proposal3)
    expect(await contracts.base.ecox.minters(alice.address)).to.be.true
    const proposal4 = await deploy(alice, MinterProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      false,
    ])
    await passProposal(proposal4)
    expect(await contracts.base.ecox.minters(alice.address)).to.be.false
  })

  it('add a burner', async () => {
    expect(await contracts.base.eco.burners(alice.address)).to.be.false
    const proposal1 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.eco.address,
      alice.address,
      true,
    ])
    await passProposal(proposal1)
    expect(await contracts.base.eco.burners(alice.address)).to.be.true

    expect(await contracts.base.ecox.burners(alice.address)).to.be.false
    const proposal2 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      true,
    ])
    await passProposal(proposal2)
    expect(await contracts.base.ecox.burners(alice.address)).to.be.true
  })

  it('remove a burner', async () => {
    const proposal1 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.eco.address,
      alice.address,
      true,
    ])
    await passProposal(proposal1)
    expect(await contracts.base.eco.burners(alice.address)).to.be.true
    const proposal2 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.eco.address,
      alice.address,
      false,
    ])
    await passProposal(proposal2)
    expect(await contracts.base.eco.burners(alice.address)).to.be.false

    const proposal3 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      true,
    ])
    await passProposal(proposal3)
    expect(await contracts.base.ecox.burners(alice.address)).to.be.true
    const proposal4 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      false,
    ])
    await passProposal(proposal4)
    expect(await contracts.base.ecox.burners(alice.address)).to.be.false
  })

  it('add a rebaser', async () => {
    expect(await contracts.base.eco.rebasers(alice.address)).to.be.false
    const proposal1 = await deploy(alice, RebaserProposal__factory, [
      contracts.base.eco.address,
      alice.address,
      true,
    ])
    await passProposal(proposal1)
    expect(await contracts.base.eco.rebasers(alice.address)).to.be.true
  })

  it('remove a rebaser', async () => {
    expect(
      await contracts.base.eco.rebasers(contracts.monetary.rebaseLever.address)
    ).to.be.true
    const proposal1 = await deploy(alice, RebaserProposal__factory, [
      contracts.base.eco.address,
      contracts.monetary.rebaseLever.address,
      false,
    ])
    await passProposal(proposal1)
    expect(
      await contracts.base.eco.rebasers(contracts.monetary.rebaseLever.address)
    ).to.be.false
  })

  it('add a snapshotter', async () => {
    expect(await contracts.base.eco.snapshotters(alice.address)).to.be.false
    const proposal1 = await deploy(alice, SnapshotterProposal__factory, [
      contracts.base.eco.address,
      alice.address,
      true,
    ])
    await passProposal(proposal1)
    expect(await contracts.base.eco.snapshotters(alice.address)).to.be.true
  })

  it('remove a snapshotter', async () => {
    expect(
      await contracts.base.eco.snapshotters(
        contracts.community.communityGovernance.address
      )
    ).to.be.true
    const proposal1 = await deploy(alice, SnapshotterProposal__factory, [
      contracts.base.eco.address,
      contracts.community.communityGovernance.address,
      false,
    ])
    await passProposal(proposal1)
    expect(
      await contracts.base.eco.snapshotters(
        contracts.community.communityGovernance.address
      )
    ).to.be.false
  })

  it('change ECOxExchange', async () => {
    expect(await contracts.base.ecox.ecoXExchange()).to.eq(
      contracts.base.ecoXExchange.address
    )
    const proposal1 = await deploy(alice, UpdateECOxExchangeProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
    ])
    await passProposal(proposal1)
    expect(await contracts.base.ecox.ecoXExchange()).to.eq(alice.address)
  })

  it('change eco pauser', async () => {
    expect(await contracts.base.eco.pauser()).to.eq(
      alice.address
    )
    const proposal1 = await deploy(alice, UpdateTokenPauserProposal__factory, [
      contracts.base.eco.address,
      bob.address,
    ])
    await passProposal(proposal1)
    expect(await contracts.base.eco.pauser()).to.eq(bob.address)
  })

  it('change ecox pauser', async () => {
    expect(await contracts.base.ecox.pauser()).to.eq(
      alice.address
    )
    const proposal1 = await deploy(alice, UpdateTokenPauserProposal__factory, [
      contracts.base.ecox.address,
      bob.address,
    ])
    await passProposal(proposal1)
    expect(await contracts.base.ecox.pauser()).to.eq(bob.address)
  })

  it('change governance pauser', async () => {
    expect(await contracts.community.communityGovernance.pauser()).to.eq(
      alice.address
    )
    const proposal1 = await deploy(alice, UpdateGovernancePauserProposal__factory, [
      contracts.community.communityGovernance.address,
      bob.address,
    ])
    await passProposal(proposal1)
    expect(await contracts.community.communityGovernance.pauser()).to.eq(bob.address)
  })

  it('sweep governance fees', async () => {
    expect(await contracts.base.eco.balanceOf(bob.address)).to.eq(0)
    const proposal1 = await deploy(alice, SweepGovernanceFeesProposal__factory, [
      contracts.community.communityGovernance.address,
      bob.address,
    ])
    // seed the pot with fees
    await contracts.base.eco
      .connect(alice)
      .approve(
        contracts.community.communityGovernance.address,
        await contracts.community.communityGovernance.proposalFee()
      )
    await contracts.community.communityGovernance
      .connect(alice)
      .propose(bob.address) // non-sense value but it doesn't matter
    
    await passProposal(proposal1)
    expect(await contracts.base.eco.balanceOf(bob.address)).to.eq((await contracts.community.communityGovernance.proposalFee()).sub(await contracts.community.communityGovernance.feeRefund()))
  })

  it('change governance trusted nodes contract', async () => {
    expect(await contracts.monetary.monetaryGovernance.trustedNodes()).to.eq(
      contracts.monetary.trustedNodes.address
    )
    const proposal1 = await deploy(alice, UpdateGovernanceTrustedNodesProposal__factory, [
      contracts.monetary.monetaryGovernance.address,
      bob.address,
    ])
    await passProposal(proposal1)
    expect(await contracts.monetary.monetaryGovernance.trustedNodes()).to.eq(bob.address)
  })

  it('change governance enacter contract', async () => {
    expect(await contracts.monetary.monetaryGovernance.enacter()).to.eq(
      contracts.monetary.adapter.address
    )
    const proposal1 = await deploy(alice, UpdateGovernanceEnacterProposal__factory, [
      contracts.monetary.monetaryGovernance.address,
      bob.address,
    ])
    await passProposal(proposal1)
    expect(await contracts.monetary.monetaryGovernance.enacter()).to.eq(bob.address)
  })

  it('change adapter governance contract', async () => {
    expect(await contracts.monetary.adapter.currencyGovernance()).to.eq(
      contracts.monetary.monetaryGovernance.address
    )
    const proposal1 = await deploy(alice, UpdateAdapterGovernanceProposal__factory, [
      contracts.monetary.adapter.address,
      bob.address,
    ])
    await passProposal(proposal1)
    expect(await contracts.monetary.adapter.currencyGovernance()).to.eq(bob.address)
  })

  it('change lever notifier contract', async () => {
    expect(await contracts.monetary.lockupsLever.notifier()).to.eq(
      contracts.monetary.lockupsNotifier.address
    )
    const proposal1 = await deploy(alice, UpdateLeverNotifierProposal__factory, [
      contracts.monetary.lockupsLever.address,
      bob.address,
    ])
    await passProposal(proposal1)
    expect(await contracts.monetary.lockupsLever.notifier()).to.eq(bob.address)

    expect(await contracts.monetary.rebaseLever.notifier()).to.eq(
      contracts.monetary.rebaseNotifier.address
    )
    const proposal2 = await deploy(alice, UpdateLeverNotifierProposal__factory, [
      contracts.monetary.rebaseLever.address,
      bob.address,
    ])
    await passProposal(proposal2)
    expect(await contracts.monetary.rebaseLever.notifier()).to.eq(bob.address)
  })

  it.only('add lever authorized', async () => {
    expect(await contracts.monetary.lockupsLever.authorized(alice.address)).to.be.false
    const proposal1 = await deploy(alice, UpdateLeverAuthorizedProposal__factory, [
      contracts.monetary.lockupsLever.address,
      alice.address,
      true,
    ])
    await passProposal(proposal1)
    expect(await contracts.monetary.lockupsLever.authorized(alice.address)).to.be.true

    expect(await contracts.monetary.rebaseLever.authorized(alice.address)).to.be.false
    const proposal2 = await deploy(alice, UpdateLeverAuthorizedProposal__factory, [
      contracts.monetary.rebaseLever.address,
      alice.address,
      true,
    ])
    await passProposal(proposal2)
    expect(await contracts.monetary.rebaseLever.authorized(alice.address)).to.be.true
  })

  it('remove lever authorized', async () => {
    expect(await contracts.monetary.lockupsLever.authorized(contracts.monetary.adapter.address)).to.be.true
    const proposal1 = await deploy(alice, UpdateLeverAuthorizedProposal__factory, [
      contracts.monetary.lockupsLever.address,
      contracts.monetary.adapter.address,
      false,
    ])
    await passProposal(proposal1)
    expect(await contracts.monetary.lockupsLever.authorized(contracts.monetary.adapter.address)).to.be.false

    expect(await contracts.monetary.rebaseLever.authorized(contracts.monetary.adapter.address)).to.be.true
    const proposal2 = await deploy(alice, UpdateLeverAuthorizedProposal__factory, [
      contracts.monetary.rebaseLever.address,
      contracts.monetary.adapter.address,
      false,
    ])
    await passProposal(proposal2)
    expect(await contracts.monetary.rebaseLever.authorized(contracts.monetary.adapter.address)).to.be.false
  })


})
