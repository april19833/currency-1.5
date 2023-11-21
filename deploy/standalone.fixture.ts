import { ethers } from 'hardhat'
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
  governance: string
  adapter: string
  lockups: {
    lever: string
    notifier: string
  }
  rebase: {
    lever: string
    notifier: string
  }
}

export class MonetaryGovernanceContracts {
  constructor(
    public trustedNodes: TrustedNodes,
    public governance: CurrencyGovernance,
    public adapter: MonetaryPolicyAdapter,
    public lockups: {
      lever: Lockups
      notifier: Notifier
    },
    public rebase: {
      lever: Rebase
      notifier: Notifier
    }
  ) {}

  toAddresses(): MonetaryGovernanceAddresses {
    return {
      trustedNodes: this.trustedNodes.address,
      governance: this.governance.address,
      adapter: this.adapter.address,
      lockups: {
        lever: this.lockups.lever.address,
        notifier: this.lockups.notifier.address,
      },
      rebase: {
        lever: this.rebase.lever.address,
        notifier: this.rebase.notifier.address,
      },
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

export type FixtureAddresses = {
  base: BaseAddresses
  monetary: MonetaryGovernanceAddresses
  community: CommunityGovernanceAddresses
}

export class Fixture {
  constructor(
    public base: BaseContracts,
    public monetary: MonetaryGovernanceContracts,
    public community: CommunityGovernanceContracts
  ) {}

  toAddresses(): FixtureAddresses {
    return {
      base: this.base.toAddresses(),
      monetary: this.monetary.toAddresses(),
      community: this.community.toAddresses(),
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

  const now = new Date()
  const communityGovernance = (await deploy(
    wallet,
    CommunityGovernance__factory,
    [
      base.policy.address,
      base.eco.address,
      base.ecoXStaking.address,
      Math.floor(now.getTime() / 1000),
      pauser,
    ]
  )) as CommunityGovernance

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

  const lockupsContract = (await deploy(wallet, Lockups__factory, [
    base.policy.address,
    base.eco.address,
    config.lockupDepositWindow || DEFAULT_LOCKUP_DEPOSIT_WINDOW,
  ])) as Lockups

  if (verbose) {
    console.log('deploying lockups notifier')
  }

  const lockupsNotifier = (await deploy(wallet, Notifier__factory, [
    base.policy.address,
    lockupsContract.address,
    [],
    [],
    [],
  ])) as Notifier

  if (verbose) {
    console.log('deploying rebase lever')
  }

  const rebaseContract = (await deploy(wallet, Rebase__factory, [
    base.policy.address,
    base.eco.address,
  ])) as Rebase

  if (verbose) {
    console.log('deploying rebase notifier')
  }

  const rebaseNotifier = (await deploy(wallet, Notifier__factory, [
    base.policy.address,
    rebaseContract.address,
    [],
    [],
    [],
  ])) as Notifier

  if (verbose) {
    console.log('deploying adapter')
  }

  const adapter = (await deploy(wallet, MonetaryPolicyAdapter__factory, [
    base.policy.address,
  ])) as MonetaryPolicyAdapter

  if (verbose) {
    console.log('deploying currencyGovernance')
  }

  const governance = (await deploy(wallet, CurrencyGovernance__factory, [
    base.policy.address,
    adapter.address,
  ])) as CurrencyGovernance

  if (verbose) {
    console.log('deploying trustedNodes')
  }

  const trustedNodes = (await deploy(wallet, TrustedNodes__factory, [
    base.policy.address,
    governance.address,
    base.ecox.address,
    config.trusteeTerm || DEFAULT_TRUSTEE_TERM,
    config.voteReward || DEFAULT_VOTE_REWARD,
    trustees,
  ])) as TrustedNodes

  return new MonetaryGovernanceContracts(
    trustedNodes,
    governance,
    adapter,
    {
      lever: lockupsContract,
      notifier: lockupsNotifier,
    },
    {
      lever: rebaseContract,
      notifier: rebaseNotifier,
    }
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

  const policy = (await deployProxy(wallet, Policy__factory, [
    await wallet.getAddress(), // sets the wallet as the governor until the linker proposal is run
  ])) as Policy

  if (verbose) {
    console.log('deploying eco')
  }

  const eco = (await deployProxy(wallet, ECO__factory, [
    policy.address,
    pauser,
  ])) as ECO

  if (verbose) {
    console.log('deploying ecox')
  }

  const ecox = (await deployProxy(wallet, ECOx__factory, [
    policy.address,
    pauser,
  ])) as ECOx

  if (verbose) {
    console.log('deploying ecoXExchange')
  }

  const ecoXExchange = (await deploy(wallet, ECOxExchange__factory, [
    policy.address,
    ecox.address,
    eco.address,
    initialECOxSupply,
  ])) as ECOxExchange

  if (verbose) {
    console.log('deploying ecoXStaking')
  }

  const ecoXStaking = (await deployProxy(wallet, ECOxStaking__factory, [
    policy.address,
    ecox.address,
  ])) as ECOxStaking

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
  const [wallet] = await ethers.getSigners()

  if (verbose) {
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
    monetary.lockups.notifier.address,
    monetary.rebase.notifier.address,
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

  return new Fixture(base, monetary, community)
}
