import { ethers, config as hardhatConfig } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import {
  Fixture,
  BaseContracts,
  deployBaseUnproxied,
  deployCommunity,
  deployMonetary,
  FixtureAddresses,
  MonetaryGovernanceAddresses,
  CommunityGovernanceContracts,
} from '../../deploy/standalone.fixture'
import { time, reset } from '@nomicfoundation/hardhat-network-helpers'
import { DAY } from '../utils/constants'
import {
  ECO as ECOold,
  ECOx as ECOxold,
  ECOxStaking as ECOxStakingold,
  Policy as Policyold,
  PolicyProposals__factory,
  fixtures,
  ImplementationUpdatingTarget__factory,
  PolicyVotes__factory,
} from '@helix-foundation/currency-dev'
import { ECO, ECOx } from '../../typechain-types/contracts/currency'
import { Policy } from '../../typechain-types/contracts/policy'
import { ECOxStaking } from '../../typechain-types/contracts/governance/community'
import { MigrationLinker } from '../../typechain-types/contracts/test/deploy/MigrationLinker.propo.sol'
import { SnapshotUpdatingTarget__factory } from '../../typechain-types/factories/contracts/test/deploy'
import { deploy } from '../../deploy/utils'
import { getExistingEco } from '../../deploy/parse-mainnet'
import { Policy__factory } from '../../typechain-types/factories/contracts/policy'
import {
  ECO__factory,
  ECOx__factory,
} from '../../typechain-types/factories/contracts/currency'
import { ECOxStaking__factory } from '../../typechain-types/factories/contracts/governance/community'
import { BigNumber } from 'ethers'
import { NoMonetaryMigrationLinker__factory } from '../../typechain-types'

const { policyFor } = fixtures

const INITIAL_ECOx = ethers.constants.WeiPerEther.mul(1000000000).toString() // taylored to match the mainnet deploy

const aliceAddr = '0x99f98ea4A883DB4692Fa317070F4ad2dC94b05CE'
const bobAddr = '0xA201d3C815AC9D4d8830fb3dE2b490B5b0069ACa'
const charlieAddr = '0xED83D2f20cF2d218Adbe0a239C0F8AbDca8Fc499'
const etherWhaleAddr = '0x00000000219ab540356cBB839Cbe05303d7705Fa'

describe.only('Mainnet fork migration tests without monetary policy', () => {
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let charlie: SignerWithAddress
  let etherWhale: SignerWithAddress

  let proposal: MigrationLinker

  let policyProxy: Policyold
  let ecoProxy: ECOold
  let ecoxProxy: ECOxold
  let ecoXStakingProxy: ECOxStakingold

  let fixtureAddresses: FixtureAddresses
  let baseContracts: BaseContracts
  let dummyMonetaryContracts: MonetaryGovernanceAddresses
  let communityGovernanceContracts: CommunityGovernanceContracts

  beforeEach(async () => {
    // reset the fork
    await reset(
      hardhatConfig.networks.hardhat.forking?.url,
      hardhatConfig.networks.hardhat.forking?.blockNumber
    )

    // setup faked addresses
    alice = await ethers.getImpersonatedSigner(aliceAddr)
    bob = await ethers.getImpersonatedSigner(bobAddr)
    charlie = await ethers.getImpersonatedSigner(charlieAddr)
    etherWhale = await ethers.getImpersonatedSigner(etherWhaleAddr)
    etherWhale.sendTransaction({
      to: alice.address,
      value: ethers.utils.parseEther('100'),
    })
    etherWhale.sendTransaction({
      to: bob.address,
      value: ethers.utils.parseEther('100'),
    })
    etherWhale.sendTransaction({
      to: charlie.address,
      value: ethers.utils.parseEther('100'),
    })
    ;({
      policy: policyProxy,
      eco: ecoProxy,
      ecox: ecoxProxy,
      ecoXStaking: ecoXStakingProxy,
    } = await getExistingEco(alice))

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

    dummyMonetaryContracts = {
      trustedNodes: '',
      monetaryGovernance: '',
      adapter: '',
      rebaseLever: '',
      rebaseNotifier: '',
      lockupsLever: '',
      lockupsNotifier: '',
    } // these contracts are unused for this deploy but still required by the datatype

    communityGovernanceContracts = await deployCommunity(
      alice,
      baseContracts,
      alice.address,
      false,
      config
    ) // sets alice to be the pauser

    fixtureAddresses = {
      ...implAddresses, // has the implementation addresses for later because the proxies are already set to global values
      ...dummyMonetaryContracts,
      ...communityGovernanceContracts.toAddresses(),
    }
  })

  it('check deployment constructors', async () => {
    const contracts: Fixture = new Fixture(
      baseContracts,
      communityGovernanceContracts
    )

    // these are pre migrated contracts
    expect(await contracts.base.eco.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.base.eco.pauser()).to.eq(alice.address)
    expect(await contracts.base.eco.decimals()).to.eq(18)
    expect(await contracts.base.eco.name()).to.eq('ECO')
    expect(await contracts.base.eco.symbol()).to.eq('ECO')

    expect(await contracts.base.ecox.policy()).to.eq(
      contracts.base.policy.address
    )
    expect(await contracts.base.ecox.pauser()).to.eq(alice.address)
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
  })

  context('with the proposal contstructed', () => {
    beforeEach(async () => {
      const implementationUpdatingTarget = await deploy(
        alice,
        ImplementationUpdatingTarget__factory
      )

      const snapshotUpdatingTarget = await deploy(
        alice,
        SnapshotUpdatingTarget__factory
      )

      const proposalParams = [
        fixtureAddresses.communityGovernance,
        fixtureAddresses.ecoXExchange,
        fixtureAddresses.policy,
        fixtureAddresses.eco,
        fixtureAddresses.ecox,
        fixtureAddresses.ecoXStaking,
        implementationUpdatingTarget.address,
        snapshotUpdatingTarget.address,
      ]

      proposal = (await deploy(
        alice,
        NoMonetaryMigrationLinker__factory,
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

      expect(await proposal.newPolicyImpl()).to.eq(fixtureAddresses.policy)
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
        await time.increase(4 * DAY)
        // executes
        await policyVotes.execute()

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
          communityGovernanceContracts
        )

        expect(await contracts.base.policy.governor()).to.eq(
          contracts.community.communityGovernance.address
        )

        expect(
          await contracts.base.ecox.burners(contracts.base.ecoXExchange.address)
        ).to.be.true

        expect(
          await contracts.base.eco.minters(contracts.base.ecoXExchange.address)
        ).to.be.true
        expect(
          await contracts.base.eco.snapshotters(
            contracts.community.communityGovernance.address
          )
        ).to.be.true
        expect(
          await contracts.base.ecox.snapshotters(
            contracts.community.communityGovernance.address
          )
        ).to.be.true
      })

      it('can withdraw from staking contract', async () => {
        const aliceEcoxBalance = await baseContracts.ecox.balanceOf(
          alice.address
        )
        const withdrawAmount = ethers.utils.parseUnits('1', 'ether')
        await baseContracts.ecoXStaking.connect(alice).withdraw(withdrawAmount)
        expect(await baseContracts.ecox.balanceOf(alice.address)).to.eq(
          aliceEcoxBalance.add(withdrawAmount)
        )
      })
    })
  })
})
