import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import {
  Fixture,
  BaseContracts,
  deployBaseUnproxied,
  deployCommunity,
  deployMonetary,
  FixtureAddresses,
  MonetaryGovernanceContracts,
  CommunityGovernanceContracts,
} from '../../deploy/standalone.fixture'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { DAY } from '../utils/constants'
import {
  ECO as ECOold,
  ECOx as ECOxold,
  ECOxStaking as ECOxStakingold,
  EcoFaucet,
  Policy as Policyold,
  TimedPolicies,
  PolicyProposals__factory,
  fixtures,
  ImplementationUpdatingTarget__factory,
  PolicyVotes__factory,
} from '@helix-foundation/currency-dev'
import { ECO, ECOx } from '../../typechain-types/contracts/currency'
import { Policy } from '../../typechain-types/contracts/policy'
import { ECOxStaking } from '../../typechain-types/contracts/governance/community'
import { MigrationLinker } from '../../typechain-types/contracts/test/deploy/MigrationLinker.propo.sol'
import { MigrationLinker__factory } from '../../typechain-types/factories/contracts/test/deploy/MigrationLinker.propo.sol'
import { InflationMultiplierUpdatingTarget__factory } from '../../typechain-types/factories/contracts/test/deploy'
import { deploy } from '../../deploy/utils'
import { Policy__factory } from '../../typechain-types/factories/contracts/policy'
import {
  ECO__factory,
  ECOx__factory,
} from '../../typechain-types/factories/contracts/currency'
import { ECOxStaking__factory } from '../../typechain-types/factories/contracts/governance/community'
import { BigNumber } from 'ethers'

const { ecoFixture, policyFor } = fixtures

const INITIAL_ECOx = ethers.constants.WeiPerEther.mul(100).toString() // taylored to match the 1.0 fixture deploy

const PAUSER = '0xDEADBEeFbAdf00dC0fFee1Ceb00dAFACEB00cEc0'

const TRUSTEE_TERM = 26 * 14 * DAY
const VOTE_REWARD = 1000
const LOCKUP_DEPOSIT_WINDOW = 2 * DAY

const stake = ethers.utils.parseEther('5000000')

describe('Migration tests', () => {
  let alice: SignerWithAddress
  let trustee1: SignerWithAddress
  let trustee2: SignerWithAddress

  let proposal: MigrationLinker

  let policyProxy: Policyold
  let ecoProxy: ECOold
  let ecoxProxy: ECOxold
  let ecoXStakingProxy: ECOxStakingold
  let faucet: EcoFaucet
  let timedPolicies: TimedPolicies

  let fixtureAddresses: FixtureAddresses
  let baseContracts: BaseContracts
  let monetaryGovernanceContracts: MonetaryGovernanceContracts
  let communityGovernanceContracts: CommunityGovernanceContracts

  before(async () => {
    ;[alice, trustee1, trustee2] = await ethers.getSigners()
  })

  beforeEach(async () => {
    ;({
      policy: policyProxy,
      eco: ecoProxy,
      ecox: ecoxProxy,
      ecoXStaking: ecoXStakingProxy,
      faucet,
      timedPolicies,
    } = await ecoFixture(
      [trustee1.address, trustee2.address],
      VOTE_REWARD.toString()
    ))
    // set up stake for voting
    await faucet.mint(alice.address, stake)
    // wait one generation for the funds to be within the snapshot
    await time.increase(3600 * 24 * 14)
    await timedPolicies.incrementGeneration()

    // deploy the new contracts with proxy implementations only
    const config = {
      verify: false,
      policyProxyAddress: policyProxy.address,
      ecoProxyAddress: ecoProxy.address,
      ecoxProxyAddress: ecoxProxy.address,
      ecoXStakingProxyAddress: ecoXStakingProxy.address,
      noLockups: true,
      governanceStartTime: await time.latest(),
    }

    // deploy base contracts
    baseContracts = await deployBaseUnproxied(
      alice,
      INITIAL_ECOx,
      false,
      config
    )

    const implAddresses = baseContracts.toAddresses()

    // edit the base contracts object so it has the proxy addresses in the right places
    baseContracts.policy = policyProxy as unknown as Policy
    baseContracts.eco = ecoProxy as unknown as ECO
    baseContracts.ecox = ecoxProxy as unknown as ECOx
    baseContracts.ecoXStaking = ecoXStakingProxy as unknown as ECOxStaking

    monetaryGovernanceContracts = await deployMonetary(
      alice,
      baseContracts,
      [trustee1.address, trustee2.address],
      false,
      config
    )
    communityGovernanceContracts = await deployCommunity(
      alice,
      baseContracts,
      alice.address,
      false,
      config
    ) // sets alice to be the pauser

    fixtureAddresses = {
      ...implAddresses, // has the implementation addresses for later because the proxies are already set to global values
      ...monetaryGovernanceContracts.toAddresses(),
      ...communityGovernanceContracts.toAddresses(),
    }
  })

  it('check deployment constructors', async () => {
    const contracts: Fixture = new Fixture(
      baseContracts,
      monetaryGovernanceContracts,
      communityGovernanceContracts
    )

    // these are pre migrated contracts
    expect(await contracts.base.eco.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.base.eco.pauser()).to.eq(PAUSER)
    expect(await contracts.base.eco.decimals()).to.eq(18)
    expect(await contracts.base.eco.name()).to.eq('ECO')
    expect(await contracts.base.eco.symbol()).to.eq('ECO')

    expect(await contracts.base.ecox.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.base.ecox.pauser()).to.eq(
      ethers.constants.AddressZero
    )
    expect(await contracts.base.ecox.decimals()).to.eq(18)
    expect(await contracts.base.ecox.name()).to.eq('ECOx')
    expect(await contracts.base.ecox.symbol()).to.eq('ECOx')

    expect(await contracts.base.ecoXStaking.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.base.ecoXStaking.ecoXToken()).to.eq(
      contracts.base.ecox.address
    )
    expect(await contracts.base.ecoXStaking.decimals()).to.eq(18)
    expect(await contracts.base.ecoXStaking.name()).to.eq('Staked ECOx')
    expect(await contracts.base.ecoXStaking.symbol()).to.eq('sECOx')
    expect(await contracts.base.ecoXStaking.pauser()).to.eq(
      ethers.constants.AddressZero
    )

    // these are contracts deployed for post migration
    expect(await contracts.base.ecoXExchange.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.base.ecoXExchange.eco()).to.eq(
      contracts.base.eco.address
    )
    expect(await contracts.base.ecoXExchange.ecox()).to.eq(
      contracts.base.ecox.address
    )
    expect(await contracts.base.ecoXExchange.initialSupply()).to.eq(
      INITIAL_ECOx
    )

    expect(await contracts.community.communityGovernance.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.community.communityGovernance.pauser()).to.eq(
      alice.address
    )
    expect(await contracts.community.communityGovernance.ecoToken()).to.eq(
      contracts.base.eco.address
    )
    expect(await contracts.community.communityGovernance.ecoXStaking()).to.eq(
      contracts.base.ecoXStaking.address
    )

    expect(await contracts.monetary.rebaseLever.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.monetary.rebaseLever.eco()).to.eq(
      contracts.base.eco.address
    )

    expect(await contracts.monetary.rebaseNotifier.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.monetary.rebaseNotifier.lever()).to.eq(
      contracts.monetary.rebaseLever.address
    )

    expect(await contracts.monetary.adapter.policy()).to.eq(
      contracts.base.policy.address
    )

    expect(await contracts.monetary.monetaryGovernance.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.monetary.monetaryGovernance.enacter()).to.eq(
      contracts.monetary.adapter.address
    )
    expect(
      await contracts.monetary.monetaryGovernance.governanceStartTime()
    ).to.not.eq(0)

    expect(await contracts.monetary.trustedNodes.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.monetary.trustedNodes.ecoX()).to.eq(
      contracts.base.ecox.address
    )
    expect(await contracts.monetary.trustedNodes.currencyGovernance()).to.eq(
      contracts.monetary.monetaryGovernance.address
    )
    expect(await contracts.monetary.trustedNodes.voteReward()).to.eq(
      VOTE_REWARD
    )
    expect(await contracts.monetary.trustedNodes.termEnd()).to.not.eq(0)
    expect(await contracts.monetary.trustedNodes.termStart()).to.eq(
      (await contracts.monetary.trustedNodes.termEnd()).sub(TRUSTEE_TERM)
    )
    expect(await contracts.monetary.trustedNodes.isTrusted(alice.address)).to.be
      .false
    expect(await contracts.monetary.trustedNodes.isTrusted(trustee1.address)).to
      .be.true
    expect(await contracts.monetary.trustedNodes.isTrusted(trustee2.address)).to
      .be.true
  })

  context('with the proposal constructed', () => {
    beforeEach(async () => {
      const implementationUpdatingTarget = await deploy(
        alice,
        ImplementationUpdatingTarget__factory
      )

      const inflationMultiplierUpdatingTarget = await deploy(
        alice,
        InflationMultiplierUpdatingTarget__factory
      )

      const proposalParams = [
        fixtureAddresses.communityGovernance,
        fixtureAddresses.ecoXExchange,
        fixtureAddresses.rebaseNotifier,
        fixtureAddresses.lockupsNotifier,
        fixtureAddresses.trustedNodes,
        fixtureAddresses.policy,
        fixtureAddresses.eco,
        fixtureAddresses.ecox,
        fixtureAddresses.ecoXStaking,
        implementationUpdatingTarget.address,
        inflationMultiplierUpdatingTarget.address,
      ]

      proposal = (await deploy(
        alice,
        MigrationLinker__factory,
        proposalParams
      )) as MigrationLinker
      await proposal.deployed()
    })

    it('proposal constructs correctly', async () => {
      expect(await proposal.newEcoImpl()).to.eq(fixtureAddresses.eco)

      expect(await proposal.ecoProxyAddress()).to.eq(baseContracts.eco.address)

      expect(fixtureAddresses.eco).to.not.eq(baseContracts.eco.address)

      expect(await proposal.newEcoxImpl()).to.eq(fixtureAddresses.ecox)

      expect(await proposal.ecoxProxyAddress()).to.eq(
        baseContracts.ecox.address
      )

      expect(fixtureAddresses.ecox).to.not.eq(baseContracts.ecox.address)

      expect(await proposal.newEcoxStakingImpl()).to.eq(
        fixtureAddresses.ecoXStaking
      )

      expect(await proposal.ecoXStakingProxyAddress()).to.eq(
        baseContracts.ecoXStaking.address
      )

      expect(fixtureAddresses.ecoXStaking).to.not.eq(
        baseContracts.ecoXStaking.address
      )

      expect(await proposal.communityGovernance()).to.eq(
        fixtureAddresses.communityGovernance
      )

      expect(await proposal.ecoXExchange()).to.eq(fixtureAddresses.ecoXExchange)

      expect(await proposal.rebase()).to.eq(fixtureAddresses.rebaseLever)

      expect(await proposal.rebaseNotifier()).to.eq(
        fixtureAddresses.rebaseNotifier
      )

      expect(await proposal.monetaryPolicyAdapter()).to.eq(
        fixtureAddresses.adapter
      )

      expect(await proposal.currencyGovernance()).to.eq(
        fixtureAddresses.monetaryGovernance
      )

      expect(await proposal.trustedNodes()).to.eq(fixtureAddresses.trustedNodes)

      expect(await proposal.newPolicyImpl()).to.eq(fixtureAddresses.policy)

      expect(await monetaryGovernanceContracts.lockupsLever.policy()).to.eq(
        baseContracts.policy.address
      )
      expect(await monetaryGovernanceContracts.lockupsLever.eco()).to.eq(
        baseContracts.eco.address
      )
      expect(
        await monetaryGovernanceContracts.lockupsLever.depositWindow()
      ).to.eq(LOCKUP_DEPOSIT_WINDOW)

      expect(
        await monetaryGovernanceContracts.lockupsNotifier.policy()
      ).to.eq(baseContracts.policy.address)
      expect(
        await monetaryGovernanceContracts.lockupsNotifier.lever()
      ).to.eq(monetaryGovernanceContracts.lockupsLever.address)
    })

    context('with enacted proposal', () => {
      let oldPolicyImpl
      let oldEcoImpl
      let oldEcoxImpl
      let oldEcoXStakingImpl
      let oldInflationMult: BigNumber

      beforeEach(async () => {
        // confirm start state
        oldPolicyImpl = await policyProxy.implementation()
        oldEcoImpl = await ecoProxy.implementation()
        oldEcoxImpl = await ecoxProxy.implementation()
        oldEcoXStakingImpl = await ecoXStakingProxy.implementation()
        oldInflationMult = await ecoProxy.getPastLinearInflation(
          await time.latestBlock()
        )

        // the addresses in fixtureAddresses have the new impls, and this check confirms that fact
        expect(fixtureAddresses.policy).to.not.eq(oldPolicyImpl)
        expect(fixtureAddresses.eco).to.not.eq(oldEcoImpl)
        expect(fixtureAddresses.ecox).to.not.eq(oldEcoxImpl)
        expect(fixtureAddresses.ecoXStaking).to.not.eq(oldEcoXStakingImpl)

        // grab the policyProposals contract
        const proposalsHash = ethers.utils.solidityKeccak256(
          ['string'],
          ['PolicyProposals']
        )
        const policyProposals = new PolicyProposals__factory(alice).attach(
          await policyFor(policyProxy, proposalsHash)
        )

        // submit proposal
        await ecoProxy
          .connect(alice)
          .approve(
            policyProposals.address,
            await policyProposals.COST_REGISTER()
          )
        await policyProposals.connect(alice).registerProposal(proposal.address)

        // support through to voting
        await policyProposals.connect(alice).support(proposal.address)
        await policyProposals.connect(alice).deployProposalVoting()

        // get policy votes object
        const policyVotesIdentifierHash = ethers.utils.solidityKeccak256(
          ['string'],
          ['PolicyVotes']
        )
        const policyVotes = new PolicyVotes__factory(alice).attach(
          await policyFor(policyProxy, policyVotesIdentifierHash)
        )

        // confirm vote
        await policyVotes.connect(alice).vote(true)
        // wait until end of voting phase
        await time.increase(3600 * 24 * 4)
        // executes
        await policyVotes.execute()

        // initialize the voting for the lockup
        await monetaryGovernanceContracts.lockupsLever.initializeVoting()

        // edit the base contracts object so it has the right interface object
        baseContracts.policy = new Policy__factory(alice).attach(
          policyProxy.address
        )
        baseContracts.eco = new ECO__factory(alice).attach(ecoProxy.address)
        baseContracts.ecox = new ECOx__factory(alice).attach(ecoxProxy.address)
        baseContracts.ecoXStaking = new ECOxStaking__factory(alice).attach(
          ecoXStakingProxy.address
        )
      })

      it('changes proxy implementations', async () => {
        const newPolicyImpl = await baseContracts.policy.implementation()
        const newEcoImpl = await baseContracts.eco.implementation()
        const newEcoxImpl = await baseContracts.ecox.implementation()
        const newEcoXStakingImpl =
          await baseContracts.ecoXStaking.implementation()

        expect(fixtureAddresses.policy).to.eq(newPolicyImpl)
        expect(fixtureAddresses.eco).to.eq(newEcoImpl)
        expect(fixtureAddresses.ecox).to.eq(newEcoxImpl)
        expect(fixtureAddresses.ecoXStaking).to.eq(newEcoXStakingImpl)
      })

      it('check preservation of inflation multiplier', async () => {
        expect(await baseContracts.eco.inflationMultiplier()).to.eq(
          oldInflationMult
        )
      })

      it('check deployment linking', async () => {
        const contracts = new Fixture(
          baseContracts,
          monetaryGovernanceContracts,
          communityGovernanceContracts
        )

        expect(await contracts.base.policy.governor()).to.eq(
          contracts.community.communityGovernance.address
        )

        expect(await contracts.base.ecox.ecoXExchange()).to.eq(
          contracts.base.ecoXExchange.address
        )
        expect(
          await contracts.base.ecox.burners(contracts.base.ecoXExchange.address)
        ).to.be.true

        expect(
          await contracts.base.eco.minters(contracts.base.ecoXExchange.address)
        ).to.be.true
        expect(
          await contracts.base.eco.rebasers(
            contracts.monetary.rebaseLever.address
          )
        ).to.be.true
        expect(
          await contracts.base.eco.snapshotters(
            contracts.community.communityGovernance.address
          )
        ).to.be.true

        expect(
          await contracts.monetary.rebaseLever.authorized(
            contracts.monetary.adapter.address
          )
        ).to.be.true
        expect(await contracts.monetary.rebaseLever.notifier()).to.eq(
          contracts.monetary.rebaseNotifier.address
        )
        let tx = await contracts.monetary.rebaseNotifier.transactions(0)
        expect(tx.target).to.eq('0x09bC52B9EB7387ede639Fc10Ce5Fa01CBCBf2b17')
        expect(tx.data).to.eq('0xfff6cae9')
        expect(tx.gasCost).to.eq(75000)

        tx = await contracts.monetary.rebaseNotifier.transactions(1)
        expect(tx.target).to.eq('0xAa029BbdC947F5205fBa0F3C11b592420B58f824')
        expect(tx.data).to.eq(
          '0x429046420000000000000000000000000000000000000000000000000000000000000000'
        )
        expect(tx.gasCost).to.eq(380000)

        expect(await contracts.monetary.adapter.currencyGovernance()).to.eq(
          contracts.monetary.monetaryGovernance.address
        )
        expect(
          await contracts.monetary.monetaryGovernance.trustedNodes()
        ).to.eq(contracts.monetary.trustedNodes.address)

        expect(
          await contracts.base.eco.voter(
            contracts.monetary.lockupsLever.address
          )
        ).to.be.true

        expect(
          await contracts.base.eco.minters(
            contracts.monetary.lockupsLever.address
          )
        ).to.be.true
        expect(
          await contracts.monetary.lockupsLever.authorized(
            contracts.monetary.adapter.address
          )
        ).to.be.true
        expect(
          await contracts.monetary.lockupsLever.notifier()
        ).to.eq(contracts.monetary.lockupsNotifier.address)
      })
    })
  })
})
