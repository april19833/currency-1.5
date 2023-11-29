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
  PolicyProposals,
  TimedPolicies,
  PolicyProposals__factory,
  fixtures,
} from '@helix-foundation/currency-dev'
import { ECO, ECOx } from '../../typechain-types/contracts/currency'
import { Policy } from '../../typechain-types/contracts/policy'
import { ECOxStaking } from '../../typechain-types/contracts/governance/community'

const {
  ecoFixture,
  policyFor,
  deploySingletons
} = fixtures

const INITIAL_ECO = ethers.constants.WeiPerEther.mul(1000).toString()
const INITIAL_ECOx = ethers.constants.WeiPerEther.mul(100).toString() // taylored to match the 1.0 fixture deploy

const PAUSER = '0xDEADBEeFbAdf00dC0fFee1Ceb00dAFACEB00cEc0'

const TRUSTEE_TERM = 26 * 14 * DAY
const VOTE_REWARD = 1000
const LOCKUP_DEPOSIT_WINDOW = 2 * DAY

const stake = ethers.utils.parseEther('200')

describe.only('Migration tests', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let trustee1: SignerWithAddress
  let trustee2: SignerWithAddress

  let policyProxy: Policyold
  let ecoProxy: ECOold
  let ecoxProxy: ECOxold
  let ecoXStakingProxy: ECOxStakingold
  let faucet: EcoFaucet
  let timedPolicies: TimedPolicies
  let policyProposals: PolicyProposals

  let fixtureAddressses: FixtureAddresses
  let baseContracts: BaseContracts
  let monetaryGovernanceContracts: MonetaryGovernanceContracts
  let communityGovernanceContracts: CommunityGovernanceContracts

  before(async () => {
    ;[alice, bob, trustee1, trustee2] = await ethers.getSigners()
  })

  beforeEach(async () => {
    ;({
      policy: policyProxy,
      eco: ecoProxy,
      ecox: ecoxProxy,
      ecoXStaking: ecoXStakingProxy,
      faucet,
      timedPolicies,
    } = await ecoFixture([trustee1.address, trustee2.address], VOTE_REWARD.toString()))
    // set up stake for voting
    await faucet.mint(alice.address, stake)
    await faucet.mint(bob.address, stake)
    // wait one generation for the funds to be within the snapshot
    await time.increase(3600 * 24 * 14)
    await timedPolicies.incrementGeneration()

    // grab the policyProposals contract
    const proposalsHash = ethers.utils.solidityKeccak256(
      ['string'],
      ['PolicyProposals']
    )
    policyProposals = (new PolicyProposals__factory(alice)).attach(
      await policyFor(policyProxy, proposalsHash)
    )

    // deploy the new contracts with proxy implementations only
    const config = {
      verify: false,
      policyProxyAddress: policyProxy.address,
      ecoProxyAddress: ecoProxy.address,
      ecoxProxyAddress: ecoxProxy.address,
      ecoXStakingProxyAddress: ecoXStakingProxy.address,
    }

    // deploy base contracts
    baseContracts = await deployBaseUnproxied(alice, INITIAL_ECOx, false, config)

    const implAddresses = baseContracts.toAddresses()

    // edit the base contracts object so it has the proxy addresses in the right places
    baseContracts.policy = policyProxy as unknown as Policy
    baseContracts.eco = ecoProxy as unknown as ECO
    baseContracts.ecox = ecoxProxy as unknown as ECOx
    baseContracts.ecoXStaking = ecoXStakingProxy as unknown as ECOxStaking

    monetaryGovernanceContracts = await deployMonetary(alice, baseContracts, [trustee1.address, trustee2.address], false, config)
    communityGovernanceContracts = await deployCommunity(alice, baseContracts, alice.address, false, config) // sets alice to be the pauser

    fixtureAddressses = {
      ...implAddresses, // has the implementation addresses for later because the proxies are already set to global values
      ...(monetaryGovernanceContracts.toAddresses()),
      ...(communityGovernanceContracts.toAddresses())
    }
  })

  it('check deployment constructors', async () => {
    const contracts: Fixture = new Fixture(baseContracts, monetaryGovernanceContracts, communityGovernanceContracts)

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
    expect(await contracts.base.ecox.pauser()).to.eq(ethers.constants.AddressZero)
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

    // expect(await contracts.monetary.lockupsLever.policy()).to.eq(
    //   contracts.base.policy.address
    // )
    // expect(await contracts.monetary.lockupsLever.eco()).to.eq(
    //   contracts.base.eco.address
    // )
    // expect(await contracts.monetary.lockupsLever.depositWindow()).to.eq(
    //   LOCKUP_DEPOSIT_WINDOW
    // )
    // expect(
    //   await contracts.monetary.lockupsLever.currentInflationMultiplier()
    // ).to.eq(await contracts.base.eco.inflationMultiplier())
    // expect(
    //   await contracts.base.eco.voter(contracts.monetary.lockupsLever.address)
    // ).to.be.true

    // expect(await contracts.monetary.lockupsNotifier.policy()).to.eq(
    //   contracts.base.policy.address
    // )
    // expect(await contracts.monetary.lockupsNotifier.lever()).to.eq(
    //   contracts.monetary.lockupsLever.address
    // )

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
    expect(await contracts.monetary.trustedNodes.termLength()).to.eq(
      TRUSTEE_TERM
    )
    expect(await contracts.monetary.trustedNodes.termEnd()).to.not.eq(0)
    expect(await contracts.monetary.trustedNodes.isTrusted(alice.address)).to.be
      .false
    expect(await contracts.monetary.trustedNodes.isTrusted(trustee1.address)).to
      .be.true
    expect(await contracts.monetary.trustedNodes.isTrusted(trustee2.address)).to
      .be.true
  })

  context('with the proposal contstructed', () => {
    beforeEach(async () => {

    })
  })

  // it('check deployment linking', async () => {
  //   const contracts: Fixture = await testnetFixture(
  //     [trustee1.address, trustee2.address],
  //     alice.address,
  //     INITIAL_ECO,
  //     INITIAL_ECOx
  //   )

  //   expect(await contracts.base.policy.governor()).to.eq(
  //     contracts.community.communityGovernance.address
  //   )

  //   expect(await contracts.base.ecox.ecoXExchange()).to.eq(
  //     contracts.base.ecoXExchange.address
  //   )
  //   expect(
  //     await contracts.base.ecox.burners(contracts.base.ecoXExchange.address)
  //   ).to.be.true

  //   expect(
  //     await contracts.base.eco.minters(contracts.base.ecoXExchange.address)
  //   ).to.be.true
  //   expect(
  //     await contracts.base.eco.minters(contracts.monetary.lockupsLever.address)
  //   ).to.be.true
  //   expect(
  //     await contracts.base.eco.rebasers(contracts.monetary.rebaseLever.address)
  //   ).to.be.true
  //   expect(
  //     await contracts.base.eco.snapshotters(
  //       contracts.community.communityGovernance.address
  //     )
  //   ).to.be.true

  //   expect(
  //     await contracts.monetary.lockupsLever.authorized(
  //       contracts.monetary.adapter.address
  //     )
  //   ).to.be.true
  //   expect(await contracts.monetary.lockupsLever.notifier()).to.eq(
  //     contracts.monetary.lockupsNotifier.address
  //   )
  //   expect(
  //     await contracts.monetary.rebaseLever.authorized(
  //       contracts.monetary.adapter.address
  //     )
  //   ).to.be.true
  //   expect(await contracts.monetary.rebaseLever.notifier()).to.eq(
  //     contracts.monetary.rebaseNotifier.address
  //   )

  //   expect(await contracts.monetary.adapter.currencyGovernance()).to.eq(
  //     contracts.monetary.monetaryGovernance.address
  //   )
  //   expect(await contracts.monetary.monetaryGovernance.trustedNodes()).to.eq(
  //     contracts.monetary.trustedNodes.address
  //   )
  // })
})
