import { ethers } from 'hardhat'
import fs from 'fs'
import path from 'path'
import { deploy, deployProxy } from './utils'
import {
  CommunityGovernance,
  CommunityGovernance__factory,
  CurrencyGovernance,
  CurrencyGovernance__factory,
  ECO,
  ECO__factory,
  ECOx,
  ECOxExchange,
  ECOxExchange__factory,
  ECOxStaking,
  ECOxStaking__factory,
  ECOx__factory,
  Lockups,
  Lockups__factory,
  MonetaryPolicyAdapter,
  MonetaryPolicyAdapter__factory,
  Notifier,
  Notifier__factory,
  Policy,
  Policy__factory,
  Rebase,
  Rebase__factory,
  TestnetLinker,
  TestnetLinker__factory,
  TrustedNodes,
  TrustedNodes__factory,
} from '../typechain-types'
import { Signer } from 'ethers'
import { DAY } from '../test/utils/constants'

const DEFAULT_TRUSTEE_TERM = 26 * 14 * DAY
const DEFAULT_VOTE_REWARD = 1000
const DEFAULT_LOCKUP_DEPOSIT_WINDOW = 2 * DAY

const buildTime = Date.now()
const outputStem = path.join(__dirname, `deployments`)
const outputFolder = `${outputStem}/${buildTime}`

export type BaseAddresses = {
  policy: string
  eco: string
  ecox: string
  ecoXStaking: string
  ecoXExchange: string
}

export class BaseContracts {
  constructor(
    public policy: Policy,
    public eco: ECO,
    public ecox: ECOx,
    public ecoXStaking: ECOxStaking,
    public ecoXExchange: ECOxExchange
  ) {}

  toAddresses(): BaseAddresses {
    return {
      policy: this.policy.address,
      eco: this.eco.address,
      ecox: this.ecox.address,
      ecoXStaking: this.ecoXStaking.address,
      ecoXExchange: this.ecoXExchange.address,
    }
  }
}

export type MonetaryGovernanceAddresses = {
  trustedNodes: string
  monetaryGovernance: string
  adapter: string
  lockupsLever: string
  lockupsNotifier: string
  rebaseLever: string
  rebaseNotifier: string
}

export class MonetaryGovernanceContracts {
  constructor(
    public trustedNodes: TrustedNodes,
    public monetaryGovernance: CurrencyGovernance,
    public adapter: MonetaryPolicyAdapter,
    public lockupsLever: Lockups,
    public lockupsNotifier: Notifier,
    public rebaseLever: Rebase,
    public rebaseNotifier: Notifier
  ) {}

  toAddresses(): MonetaryGovernanceAddresses {
    return {
      trustedNodes: this.trustedNodes.address,
      monetaryGovernance: this.monetaryGovernance.address,
      adapter: this.adapter.address,
      lockupsLever: this.lockupsLever.address,
      lockupsNotifier: this.lockupsNotifier.address,
      rebaseLever: this.rebaseLever.address,
      rebaseNotifier: this.rebaseNotifier.address,
    }
  }
}

export type CommunityGovernanceAddresses = {
  communityGovernance: string
}

export class CommunityGovernanceContracts {
  constructor(public communityGovernance: CommunityGovernance) {}

  toAddresses(): CommunityGovernanceAddresses {
    return { communityGovernance: this.communityGovernance.address }
  }
}

export type FixtureAddresses = BaseAddresses &
  MonetaryGovernanceAddresses &
  CommunityGovernanceAddresses

export class Fixture {
  constructor(
    public base: BaseContracts,
    public monetary: MonetaryGovernanceContracts,
    public community: CommunityGovernanceContracts
  ) {}

  toAddresses(): FixtureAddresses {
    return {
      ...this.base.toAddresses(),
      ...this.monetary.toAddresses(),
      ...this.community.toAddresses(),
    }
  }
}

export async function deployCommunity(
  wallet: Signer,
  base: BaseContracts,
  pauser: string,
  verbose = false,
  config: any
): Promise<CommunityGovernanceContracts> {
  if (verbose) {
    console.log('deploying communityGovernance')
  }

  const now = Date.now()
  const communityGovernanceParams = [
    base.policy.address,
    base.eco.address,
    base.ecoXStaking.address,
    Math.floor(now / 1000),
    pauser,
  ]

  const communityGovernance = (await deploy(
    wallet,
    CommunityGovernance__factory,
    communityGovernanceParams
  )) as CommunityGovernance

  if (config.verify) {
    const output = {
      communityGovernanceParams,
    }
    fs.writeFileSync(
      `${outputFolder}/communityDeployParams.json`,
      JSON.stringify(output, null, 2)
    )
  }

  return new CommunityGovernanceContracts(communityGovernance)
}

export async function deployMonetary(
  wallet: Signer,
  base: BaseContracts,
  trustees: string[],
  verbose = false,
  config: any
): Promise<MonetaryGovernanceContracts> {
  if (verbose) {
    console.log('deploying lockups lever')
  }

  const lockupsLeverParams = [
    base.policy.address,
    base.eco.address,
    config.lockupDepositWindow || DEFAULT_LOCKUP_DEPOSIT_WINDOW,
  ]

  const lockupsContract = (await deploy(
    wallet,
    Lockups__factory,
    lockupsLeverParams
  )) as Lockups

  if (verbose) {
    console.log('deploying lockups notifier')
  }

  const lockupsNotifierParams = [
    base.policy.address,
    lockupsContract.address,
    [],
    [],
    [],
  ]

  const lockupsNotifier = (await deploy(
    wallet,
    Notifier__factory,
    lockupsNotifierParams
  )) as Notifier

  if (verbose) {
    console.log('deploying rebase lever')
  }

  const rebaseLeverParams = [base.policy.address, base.eco.address]

  const rebaseContract = (await deploy(
    wallet,
    Rebase__factory,
    rebaseLeverParams
  )) as Rebase

  if (verbose) {
    console.log('deploying rebase notifier')
  }

  const rebaseNotifierParams = [
    base.policy.address,
    rebaseContract.address,
    [],
    [],
    [],
  ]

  const rebaseNotifier = (await deploy(
    wallet,
    Notifier__factory,
    rebaseNotifierParams
  )) as Notifier

  if (verbose) {
    console.log('deploying adapter')
  }

  const adapterParams = [base.policy.address]

  const adapter = (await deploy(
    wallet,
    MonetaryPolicyAdapter__factory,
    adapterParams
  )) as MonetaryPolicyAdapter

  if (verbose) {
    console.log('deploying currencyGovernance')
  }

  const monetaryGovernanceParams = [base.policy.address, adapter.address]

  const monetaryGovernance = (await deploy(
    wallet,
    CurrencyGovernance__factory,
    monetaryGovernanceParams
  )) as CurrencyGovernance

  if (verbose) {
    console.log('deploying trustedNodes')
  }

  const trustedNodesParams = [
    base.policy.address,
    monetaryGovernance.address,
    base.ecox.address,
    config.trusteeTerm || DEFAULT_TRUSTEE_TERM,
    config.voteReward || DEFAULT_VOTE_REWARD,
    trustees,
  ]

  const trustedNodes = (await deploy(
    wallet,
    TrustedNodes__factory,
    trustedNodesParams
  )) as TrustedNodes

  if (config.verify) {
    const output = {
      lockupsLeverParams,
      lockupsNotifierParams,
      rebaseLeverParams,
      rebaseNotifierParams,
      adapterParams,
      monetaryGovernanceParams,
      trustedNodesParams,
    }
    fs.writeFileSync(
      `${outputFolder}/monetaryDeployParams.json`,
      JSON.stringify(output, null, 2)
    )
  }

  return new MonetaryGovernanceContracts(
    trustedNodes,
    monetaryGovernance,
    adapter,
    lockupsContract,
    lockupsNotifier,
    rebaseContract,
    rebaseNotifier
  )
}

export async function deployBase(
  wallet: Signer,
  pauser: string,
  initialECOxSupply: string,
  verbose = false,
  config: any
): Promise<BaseContracts> {
  if (verbose) {
    console.log('deploying policy')
  }

  const policyParams = [
    await wallet.getAddress(), // sets the wallet as the governor until the linker proposal is run
  ]

  const policyDeploy = await deployProxy(wallet, Policy__factory, policyParams)

  const policy = policyDeploy[0] as Policy

  if (verbose) {
    console.log('deploying eco')
  }

  const ecoParams = [policy.address, pauser]

  const ecoDeploy = await deployProxy(wallet, ECO__factory, ecoParams)

  const eco = ecoDeploy[0] as ECO

  if (verbose) {
    console.log('deploying ecox')
  }

  const ecoxParams = [policy.address, pauser]

  const ecoxDeploy = await deployProxy(wallet, ECOx__factory, ecoxParams)

  const ecox = ecoxDeploy[0] as ECOx

  if (verbose) {
    console.log('deploying ecoXExchange')
  }

  const ecoXExchangeParams = [
    policy.address,
    ecox.address,
    eco.address,
    initialECOxSupply,
  ]

  const ecoXExchange = (await deploy(
    wallet,
    ECOxExchange__factory,
    ecoXExchangeParams
  )) as ECOxExchange

  if (verbose) {
    console.log('deploying ecoXStaking')
  }

  const ecoXStakingParams = [policy.address, ecox.address]

  const ecoXStakingDeploy = await deployProxy(
    wallet,
    ECOxStaking__factory,
    ecoXStakingParams
  )

  const ecoXStaking = ecoXStakingDeploy[0] as ECOxStaking

  if (config.verify) {
    const output = {
      policyParams,
      ecoParams,
      ecoxParams,
      ecoXExchangeParams,
      ecoXStakingParams,
    }
    fs.writeFileSync(
      `${outputFolder}/baseDeployParams.json`,
      JSON.stringify(output, null, 2)
    )
    const outputProxyBases = {
      policyImplementation: policyDeploy[1].address,
      ecoImplementation: policyDeploy[1].address,
      ecoxImplementation: policyDeploy[1].address,
      ecoXStakingImplementation: policyDeploy[1].address,
    }
    fs.writeFileSync(
      `${outputFolder}/baseImplementationAddresses.json`,
      JSON.stringify(outputProxyBases, null, 2)
    )
  }

  return new BaseContracts(policy, eco, ecox, ecoXStaking, ecoXExchange)
}

export async function testnetFixture(
  trustees: string[],
  pauser: string,
  initialECOSupply: string,
  initialECOxSupply: string,
  verbose = false,
  config: any = {}
): Promise<Fixture> {
  config.verify = config.verify || false

  if (config.verify) {
    // create outputFolder if it doesn't exist
    if (!fs.existsSync(outputFolder)) {
      if (!fs.existsSync(outputStem)) {
        fs.mkdirSync(outputStem)
      }
      fs.mkdirSync(outputFolder)
    }
  }

  const [wallet] = await ethers.getSigners()

  if (verbose) {
    console.log(`building at ${buildTime}`)
    console.log('deploying base contracts')
  }

  const base: BaseContracts = await deployBase(
    wallet,
    pauser,
    initialECOxSupply,
    verbose,
    config
  )

  if (verbose) {
    console.log('deploying monetary contracts')
  }

  const monetary: MonetaryGovernanceContracts = await deployMonetary(
    wallet,
    base,
    trustees,
    verbose,
    config
  )

  if (verbose) {
    console.log('deploying community contracts')
  }

  const community: CommunityGovernanceContracts = await deployCommunity(
    wallet,
    base,
    pauser,
    verbose,
    config
  )

  if (verbose) {
    console.log('deploying linker proposal contracts')
  }

  await community.communityGovernance.deployed()

  const linker = (await deploy(wallet, TestnetLinker__factory, [
    community.communityGovernance.address,
    base.ecoXExchange.address,
    monetary.lockupsNotifier.address,
    monetary.rebaseNotifier.address,
    monetary.trustedNodes.address,
    initialECOSupply,
  ])) as TestnetLinker

  await linker.deployed()

  if (verbose) {
    console.log('enacting linker')
  }

  await base.policy.connect(wallet).enact(linker.address)

  if (verbose) {
    console.log('success!')
  }

  const fixture = new Fixture(base, monetary, community)

  if (config.verify) {
    fs.writeFileSync(
      `${outputFolder}/addresses.json`,
      JSON.stringify(fixture.toAddresses(), null, 2)
    )
  }

  return fixture
}
