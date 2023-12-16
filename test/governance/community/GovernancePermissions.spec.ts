import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Fixture, testnetFixture } from '../../../deploy/standalone.fixture'
import { DAY } from '../../utils/constants'
import { passProposal } from '../../utils/passProposal'
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
  UpdateNotifierLeverProposal__factory,
  SweepLockupPenaltiesProposal__factory,
  UpdateTrustedNodesGovernanceProposal__factory,
  SweepTrustedNodesProposal__factory,
} from '../../../typechain-types/factories/contracts/test/E2eTestContracts.sol'
import { deploy } from '../../../deploy/utils'
import { ECO__factory } from '../../../typechain-types/factories/contracts/currency'
import { UpdatePolicedProxyImplProposal__factory } from '../../../typechain-types/factories/contracts/test/UpdatePolicedProxyImpl.propo.sol'

const INITIAL_SUPPLY = ethers.utils.parseUnits('30000', 'ether')

describe('Policy E2E Tests', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress

  let contracts: Fixture

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
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.base.eco.minters(alice.address)).to.be.true

    expect(await contracts.base.ecox.minters(alice.address)).to.be.false
    const proposal2 = await deploy(alice, MinterProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      true,
    ])
    await passProposal(contracts, alice, proposal2)
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
    await passProposal(contracts, alice, proposal1)
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
    await passProposal(contracts, alice, proposal2)
    expect(
      await contracts.base.eco.minters(contracts.base.ecoXExchange.address)
    ).to.be.false

    const proposal3 = await deploy(alice, MinterProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      true,
    ])
    await passProposal(contracts, alice, proposal3)
    expect(await contracts.base.ecox.minters(alice.address)).to.be.true
    const proposal4 = await deploy(alice, MinterProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      false,
    ])
    await passProposal(contracts, alice, proposal4)
    expect(await contracts.base.ecox.minters(alice.address)).to.be.false
  })

  it('add a burner', async () => {
    expect(await contracts.base.eco.burners(alice.address)).to.be.false
    const proposal1 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.eco.address,
      alice.address,
      true,
    ])
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.base.eco.burners(alice.address)).to.be.true

    expect(await contracts.base.ecox.burners(alice.address)).to.be.false
    const proposal2 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      true,
    ])
    await passProposal(contracts, alice, proposal2)
    expect(await contracts.base.ecox.burners(alice.address)).to.be.true
  })

  it('remove a burner', async () => {
    const proposal1 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.eco.address,
      alice.address,
      true,
    ])
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.base.eco.burners(alice.address)).to.be.true
    const proposal2 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.eco.address,
      alice.address,
      false,
    ])
    await passProposal(contracts, alice, proposal2)
    expect(await contracts.base.eco.burners(alice.address)).to.be.false

    const proposal3 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      true,
    ])
    await passProposal(contracts, alice, proposal3)
    expect(await contracts.base.ecox.burners(alice.address)).to.be.true
    const proposal4 = await deploy(alice, BurnerProposal__factory, [
      contracts.base.ecox.address,
      alice.address,
      false,
    ])
    await passProposal(contracts, alice, proposal4)
    expect(await contracts.base.ecox.burners(alice.address)).to.be.false
  })

  it('add a rebaser', async () => {
    expect(await contracts.base.eco.rebasers(alice.address)).to.be.false
    const proposal1 = await deploy(alice, RebaserProposal__factory, [
      contracts.base.eco.address,
      alice.address,
      true,
    ])
    await passProposal(contracts, alice, proposal1)
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
    await passProposal(contracts, alice, proposal1)
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
    await passProposal(contracts, alice, proposal1)
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
    await passProposal(contracts, alice, proposal1)
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
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.base.ecox.ecoXExchange()).to.eq(alice.address)
  })

  it('change eco pauser', async () => {
    expect(await contracts.base.eco.pauser()).to.eq(alice.address)
    const proposal1 = await deploy(alice, UpdateTokenPauserProposal__factory, [
      contracts.base.eco.address,
      bob.address,
    ])
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.base.eco.pauser()).to.eq(bob.address)
  })

  it('change ecox pauser', async () => {
    expect(await contracts.base.ecox.pauser()).to.eq(alice.address)
    const proposal1 = await deploy(alice, UpdateTokenPauserProposal__factory, [
      contracts.base.ecox.address,
      bob.address,
    ])
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.base.ecox.pauser()).to.eq(bob.address)
  })

  it('change governance pauser', async () => {
    expect(await contracts.community.communityGovernance.pauser()).to.eq(
      alice.address
    )
    const proposal1 = await deploy(
      alice,
      UpdateGovernancePauserProposal__factory,
      [contracts.community.communityGovernance.address, bob.address]
    )
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.community.communityGovernance.pauser()).to.eq(
      bob.address
    )
  })

  it('sweep governance fees', async () => {
    expect(await contracts.base.eco.balanceOf(bob.address)).to.eq(0)
    const proposal1 = await deploy(
      alice,
      SweepGovernanceFeesProposal__factory,
      [contracts.community.communityGovernance.address, bob.address]
    )
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

    await passProposal(contracts, alice, proposal1)
    expect(await contracts.base.eco.balanceOf(bob.address)).to.eq(
      (await contracts.community.communityGovernance.proposalFee()).sub(
        await contracts.community.communityGovernance.feeRefund()
      )
    )
  })

  it('change governance trusted nodes contract', async () => {
    expect(await contracts.monetary.monetaryGovernance.trustedNodes()).to.eq(
      contracts.monetary.trustedNodes.address
    )
    const proposal1 = await deploy(
      alice,
      UpdateGovernanceTrustedNodesProposal__factory,
      [contracts.monetary.monetaryGovernance.address, bob.address]
    )
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.monetary.monetaryGovernance.trustedNodes()).to.eq(
      bob.address
    )
  })

  it('change governance enacter contract', async () => {
    expect(await contracts.monetary.monetaryGovernance.enacter()).to.eq(
      contracts.monetary.adapter.address
    )
    const proposal1 = await deploy(
      alice,
      UpdateGovernanceEnacterProposal__factory,
      [contracts.monetary.monetaryGovernance.address, bob.address]
    )
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.monetary.monetaryGovernance.enacter()).to.eq(
      bob.address
    )
  })

  it('change adapter governance contract', async () => {
    expect(await contracts.monetary.adapter.currencyGovernance()).to.eq(
      contracts.monetary.monetaryGovernance.address
    )
    const proposal1 = await deploy(
      alice,
      UpdateAdapterGovernanceProposal__factory,
      [contracts.monetary.adapter.address, bob.address]
    )
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.monetary.adapter.currencyGovernance()).to.eq(
      bob.address
    )
  })

  it('change lever notifier contract', async () => {
    expect(await contracts.monetary.lockupsLever.notifier()).to.eq(
      contracts.monetary.lockupsNotifier.address
    )
    const proposal1 = await deploy(
      alice,
      UpdateLeverNotifierProposal__factory,
      [contracts.monetary.lockupsLever.address, bob.address]
    )
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.monetary.lockupsLever.notifier()).to.eq(bob.address)

    expect(await contracts.monetary.rebaseLever.notifier()).to.eq(
      contracts.monetary.rebaseNotifier.address
    )
    const proposal2 = await deploy(
      alice,
      UpdateLeverNotifierProposal__factory,
      [contracts.monetary.rebaseLever.address, bob.address]
    )
    await passProposal(contracts, alice, proposal2)
    expect(await contracts.monetary.rebaseLever.notifier()).to.eq(bob.address)
  })

  it('add lever authorized', async () => {
    expect(await contracts.monetary.lockupsLever.authorized(alice.address)).to
      .be.false
    const proposal1 = await deploy(
      alice,
      UpdateLeverAuthorizedProposal__factory,
      [contracts.monetary.lockupsLever.address, alice.address, true]
    )
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.monetary.lockupsLever.authorized(alice.address)).to
      .be.true

    expect(await contracts.monetary.rebaseLever.authorized(alice.address)).to.be
      .false
    const proposal2 = await deploy(
      alice,
      UpdateLeverAuthorizedProposal__factory,
      [contracts.monetary.rebaseLever.address, alice.address, true]
    )
    await passProposal(contracts, alice, proposal2)
    expect(await contracts.monetary.rebaseLever.authorized(alice.address)).to.be
      .true
  })

  it('remove lever authorized', async () => {
    expect(
      await contracts.monetary.lockupsLever.authorized(
        contracts.monetary.adapter.address
      )
    ).to.be.true
    const proposal1 = await deploy(
      alice,
      UpdateLeverAuthorizedProposal__factory,
      [
        contracts.monetary.lockupsLever.address,
        contracts.monetary.adapter.address,
        false,
      ]
    )
    await passProposal(contracts, alice, proposal1)
    expect(
      await contracts.monetary.lockupsLever.authorized(
        contracts.monetary.adapter.address
      )
    ).to.be.false

    expect(
      await contracts.monetary.rebaseLever.authorized(
        contracts.monetary.adapter.address
      )
    ).to.be.true
    const proposal2 = await deploy(
      alice,
      UpdateLeverAuthorizedProposal__factory,
      [
        contracts.monetary.rebaseLever.address,
        contracts.monetary.adapter.address,
        false,
      ]
    )
    await passProposal(contracts, alice, proposal2)
    expect(
      await contracts.monetary.rebaseLever.authorized(
        contracts.monetary.adapter.address
      )
    ).to.be.false
  })

  it('change notifier lever contract', async () => {
    expect(await contracts.monetary.lockupsNotifier.lever()).to.eq(
      contracts.monetary.lockupsLever.address
    )
    const proposal1 = await deploy(
      alice,
      UpdateNotifierLeverProposal__factory,
      [contracts.monetary.lockupsNotifier.address, bob.address]
    )
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.monetary.lockupsNotifier.lever()).to.eq(bob.address)

    expect(await contracts.monetary.rebaseLever.notifier()).to.eq(
      contracts.monetary.rebaseNotifier.address
    )
    const proposal2 = await deploy(
      alice,
      UpdateNotifierLeverProposal__factory,
      [contracts.monetary.rebaseNotifier.address, bob.address]
    )
    await passProposal(contracts, alice, proposal2)
    expect(await contracts.monetary.rebaseNotifier.lever()).to.eq(bob.address)
  })

  it('sweep lockup test', async () => {
    // propose the monetary policy with the lockup
    const tx = await contracts.monetary.monetaryGovernance
      .connect(bob)
      .propose(
        [contracts.monetary.lockupsLever.address],
        [contracts.monetary.lockupsLever.interface.getSighash('createLockup')],
        [
          `0x${contracts.monetary.lockupsLever.interface
            .encodeFunctionData('createLockup', [
              await contracts.monetary.lockupsLever.MIN_DURATION(),
              await contracts.monetary.lockupsLever.MAX_RATE(),
            ])
            .slice(10)}`,
        ],
        'aoeu'
      )
    // get proposalId from event cuz it's easier
    const receipt = await tx.wait()
    const proposalId = receipt.events?.find(
      (e) => e.event === 'ProposalCreation'
    )?.args?.id
    // move to next stage
    await time.increase(
      await contracts.monetary.monetaryGovernance.PROPOSAL_TIME()
    )
    // need cycle number
    const cycle = await contracts.monetary.monetaryGovernance.getCurrentCycle()
    // build commit hash
    const salt = '0x' + '00'.repeat(32)
    const vote = [{ proposalId, score: 1 }]
    const commit = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        [
          'bytes32',
          'uint256',
          'address',
          '(bytes32 proposalId, uint256 score)[]',
        ],
        [salt, cycle, bob.address, vote]
      )
    )
    // vote proposal through
    await contracts.monetary.monetaryGovernance.connect(bob).commit(commit)
    // next stage
    await time.increase(
      await contracts.monetary.monetaryGovernance.VOTING_TIME()
    )
    // reveal proposal
    await contracts.monetary.monetaryGovernance.reveal(bob.address, salt, vote)
    // next stage
    await time.increase(
      await contracts.monetary.monetaryGovernance.REVEAL_TIME()
    )
    // execute proposal
    await contracts.monetary.monetaryGovernance.enact(cycle)

    // lockup now available

    // deposit into lockup
    const lockupAmount = ethers.utils.parseUnits('300', 'ether')
    await contracts.base.eco
      .connect(alice)
      .approve(contracts.monetary.lockupsLever.address, lockupAmount)
    await contracts.monetary.lockupsLever
      .connect(alice)
      .deposit(0, lockupAmount)
    // withdraw early
    await contracts.monetary.lockupsLever.connect(alice).withdraw(0)

    expect(await contracts.monetary.lockupsLever.penalties()).to.eq(
      lockupAmount.div(2).mul(ethers.utils.parseUnits('1', 'ether'))
    )
    const proposal1 = await deploy(
      alice,
      SweepLockupPenaltiesProposal__factory,
      [contracts.monetary.lockupsLever.address, bob.address]
    )
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.base.eco.balanceOf(bob.address)).to.eq(
      lockupAmount.div(2)
    )
  })

  it('change trusted nodes governance contract', async () => {
    expect(await contracts.monetary.trustedNodes.currencyGovernance()).to.eq(
      contracts.monetary.monetaryGovernance.address
    )
    const proposal1 = await deploy(
      alice,
      UpdateTrustedNodesGovernanceProposal__factory,
      [contracts.monetary.trustedNodes.address, bob.address]
    )
    await passProposal(contracts, alice, proposal1)
    expect(await contracts.monetary.trustedNodes.currencyGovernance()).to.eq(
      bob.address
    )
  })

  it('sweep trusted nodes ecox', async () => {
    const sweepAmount = 1000
    await contracts.base.ecox
      .connect(alice)
      .transfer(contracts.monetary.trustedNodes.address, sweepAmount)
    expect(
      await contracts.base.ecox.balanceOf(
        contracts.monetary.trustedNodes.address
      )
    ).to.eq(sweepAmount)
    const proposal1 = await deploy(alice, SweepTrustedNodesProposal__factory, [
      contracts.monetary.trustedNodes.address,
      bob.address,
    ])
    await passProposal(contracts, alice, proposal1)
    expect(
      await contracts.base.ecox.balanceOf(
        contracts.monetary.trustedNodes.address
      )
    ).to.eq(0)
    expect(await contracts.base.ecox.balanceOf(bob.address)).to.eq(sweepAmount)
  })

  it('upgrade proxy contract', async () => {
    const oldEcoImplAddr = await contracts.base.eco.implementation()
    expect(await contracts.base.eco.pauser()).to.eq(alice.address)

    const newEcoImpl = await deploy(alice, ECO__factory, [
      alice.address, // the policy address is alice now
      bob.address, // attempting to change the pauser from alice doesn't do anything since it's not immutable
    ])

    const proposal = await deploy(
      alice,
      UpdatePolicedProxyImplProposal__factory,
      [contracts.base.eco.address, newEcoImpl.address]
    )

    await passProposal(contracts, alice, proposal)

    const newEcoImplAddr = await contracts.base.eco.implementation()
    expect(newEcoImplAddr).to.eq(newEcoImpl.address)
    expect(newEcoImplAddr).to.not.eq(oldEcoImplAddr)
    expect(await contracts.base.eco.policy()).to.eq(alice.address) // policy is changed by implementation with a new policy
    expect(await contracts.base.eco.pauser()).to.eq(alice.address) // old pauser is kept because it is data in the proxy storage space
  })
})
