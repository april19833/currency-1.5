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

const TRUSTEE_TERM = 365 * DAY
const VOTE_REWARD = 1000 // TODO: MAKE REAL
const LOCKUP_DEPOSIT_WINDOW = 2 * DAY

export type BaseContracts = {
  policy: Policy
  eco: ECO
  ecox: ECOx
  ecoXStaking: ECOxStaking
  ecoXExchange: ECOxExchange
}

export type MonetaryGovernanceContracts = {
  trustedNodes: TrustedNodes
  governance: CurrencyGovernance
  adapter: MonetaryPolicyAdapter
  lockups: {
    lever: Lockups
    notifier: Notifier
  }
  rebase: {
    lever: Rebase
    notifier: Notifier
  }
}

export type CommunityGovernanceContracts = {
  communityGovernance: CommunityGovernance
}

export type Fixture = {
  base: BaseContracts
  monetary: MonetaryGovernanceContracts
  community: CommunityGovernanceContracts
}

export async function deployCommunity(
  wallet: Signer,
  base: BaseContracts,
  pauser: string
): Promise<CommunityGovernanceContracts> {
  const communityGovernance = (await deploy(
    wallet,
    CommunityGovernance__factory,
    [base.policy.address, base.eco.address, base.ecoXStaking.address, pauser]
  )) as CommunityGovernance

  return {
    communityGovernance,
  }
}

export async function deployMonetary(
  wallet: Signer,
  base: BaseContracts,
  trustees: string[]
): Promise<MonetaryGovernanceContracts> {
  const lockupsContract = (await deploy(wallet, Lockups__factory, [
    base.policy.address,
    base.eco.address,
    LOCKUP_DEPOSIT_WINDOW,
  ])) as Lockups

  const lockupsNotifier = (await deploy(wallet, Notifier__factory, [
    base.policy.address,
    lockupsContract.address,
    [],
    [],
    [],
  ])) as Notifier

  const rebaseContract = (await deploy(wallet, Rebase__factory, [
    base.policy.address,
    base.eco.address,
  ])) as Rebase

  const rebaseNotifier = (await deploy(wallet, Notifier__factory, [
    base.policy.address,
    rebaseContract.address,
    [],
    [],
    [],
  ])) as Notifier

  const adapter = (await deploy(wallet, MonetaryPolicyAdapter__factory, [
    base.policy.address,
  ])) as MonetaryPolicyAdapter

  const governance = (await deploy(wallet, CurrencyGovernance__factory, [
    base.policy.address,
    adapter.address,
  ])) as CurrencyGovernance

  const trustedNodes = (await deploy(wallet, TrustedNodes__factory, [
    base.policy.address,
    governance.address,
    base.ecox.address,
    TRUSTEE_TERM,
    VOTE_REWARD,
    trustees,
  ])) as TrustedNodes

  return {
    trustedNodes,
    governance,
    adapter,
    lockups: {
      lever: lockupsContract,
      notifier: lockupsNotifier,
    },
    rebase: {
      lever: rebaseContract,
      notifier: rebaseNotifier,
    },
  }
}

export async function deployBase(
  wallet: Signer,
  pauser: string,
  initialECOxSupply: string
): Promise<BaseContracts> {
  const policy = (await deployProxy(wallet, Policy__factory, [
    await wallet.getAddress(), // sets the wallet as the governor until the linker proposal is run
  ])) as Policy

  const eco = (await deployProxy(wallet, ECO__factory, [
    policy.address,
    pauser,
  ])) as ECO

  const ecox = (await deployProxy(wallet, ECOx__factory, [
    policy.address,
    pauser,
  ])) as ECOx

  const ecoXExchange = (await deploy(wallet, ECOxExchange__factory, [
    policy.address,
    ecox.address,
    eco.address,
    initialECOxSupply,
  ])) as ECOxExchange

  const ecoXStaking = (await deployProxy(wallet, ECOxStaking__factory, [
    policy.address,
    ecox.address,
  ])) as ECOxStaking

  return {
    policy,
    eco,
    ecox,
    ecoXStaking,
    ecoXExchange,
  }
}

export async function testnetFixture(
  trustees: string[],
  pauser: string,
  initialECOSupply: string,
  initialECOxSupply: string
): Promise<Fixture> {
  const [wallet] = await ethers.getSigners()
  const base: BaseContracts = await deployBase(
    wallet,
    pauser,
    initialECOxSupply
  )
  const monetary: MonetaryGovernanceContracts = await deployMonetary(
    wallet,
    base,
    trustees
  )
  const community: CommunityGovernanceContracts = await deployCommunity(
    wallet,
    base,
    pauser
  )

  const linker = (await deploy(wallet, TestnetLinker__factory, [
    community.communityGovernance.address,
    base.ecoXExchange.address,
    monetary.lockups.notifier.address,
    monetary.rebase.notifier.address,
    monetary.trustedNodes.address,
    initialECOSupply,
  ])) as TestnetLinker

  await base.policy.connect(wallet).enact(linker.address)

  return {
    base,
    monetary,
    community,
  }
}

