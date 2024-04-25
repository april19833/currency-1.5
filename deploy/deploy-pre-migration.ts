import { ethers } from 'hardhat'
import {
  Fixture,
  deployBaseUnproxied,
  deployCommunity,
  deployMonetary,
} from './standalone.fixture'
import { ECO, ECOx } from '../typechain-types/contracts/currency'
import { Policy } from '../typechain-types/contracts/policy'
import { ECOxStaking } from '../typechain-types/contracts/governance/community'
import { MigrationLinker__factory } from '../typechain-types/factories/contracts/test/deploy/MigrationLinker.propo.sol'
import { SnapshotUpdatingTarget__factory } from '../typechain-types/factories/contracts/test/deploy'
import { ImplementationUpdatingTarget__factory } from '@helix-foundation/currency-dev'
import { deploy } from './utils'
import { DAY } from '../test/utils/constants'

const initialECOxSupply = ethers.utils.parseEther('10000000000').toString()

const startTime = 1704926064

const policyProxyAddress = '0xafce51a3bfed22490343e25f66b10bd8677e22b9'
const ecoProxyAddress = '0x3e87d4d9e69163e7590f9b39a70853cf25e5abe3'
const ecoxProxyAddress = '0x9bf228552f5a9eb626529cd5f96dfecdde5ca5a9'
const ecoXStakingProxyAddress = '0xdea3e9dedeeaa6a9546c7a5604d07b59b31b552a'

const trustee1Address = '0xEEc31f9E2048B6f9B9F00e99f31eab6631C4D3f7'
const trustee2Address = '0xa53ac6C172cB04f2c9Ea8356fAF89eA405430e14'

async function main() {
  const [wallet] = await ethers.getSigners()
  console.log(wallet.address)

  const config = {
    verify: true,
    policyProxyAddress,
    ecoProxyAddress,
    ecoxProxyAddress,
    ecoXStakingProxyAddress,
    noLockups: true,
    governanceStartTime: startTime,
    termStart: startTime,
    trusteeTerm: 7*DAY,
    lockupDepositWindow: 300, // 5 minutes
  }

  const baseContracts = await deployBaseUnproxied(
    wallet,
    initialECOxSupply,
    true,
    config
  )

  const implAddresses = baseContracts.toAddresses()

  // edit the base contracts object so it has the proxy addresses in the right places
  baseContracts.policy = { address: policyProxyAddress } as unknown as Policy
  baseContracts.eco = { address: ecoProxyAddress } as unknown as ECO
  baseContracts.ecox = { address: ecoxProxyAddress } as unknown as ECOx
  baseContracts.ecoXStaking = {
    address: ecoXStakingProxyAddress,
  } as unknown as ECOxStaking

  const monetaryGovernanceContracts = await deployMonetary(
    wallet,
    baseContracts,
    [trustee1Address, trustee2Address],
    true,
    config
  )

  const communityGovernanceContracts = await deployCommunity(
    wallet,
    baseContracts,
    wallet.address,
    true,
    config
  )

  const contracts = new Fixture(
    baseContracts,
    communityGovernanceContracts,
    monetaryGovernanceContracts
  )
  const fixtureAddresses = contracts.toAddresses()

  console.log('deploying linker')

  const implementationUpdatingTarget = await deploy(
    wallet,
    ImplementationUpdatingTarget__factory
  )

  const snapshotUpdatingTarget = await deploy(
    wallet,
    SnapshotUpdatingTarget__factory
  )

  const proposalParams = [
    fixtureAddresses.communityGovernance,
    fixtureAddresses.ecoXExchange,
    fixtureAddresses.rebaseNotifier,
    fixtureAddresses.trustedNodes,
    implAddresses.policy,
    implAddresses.eco,
    implAddresses.ecox,
    implAddresses.ecoXStaking,
    implementationUpdatingTarget.address,
    snapshotUpdatingTarget.address,
  ]

  const proposal = await deploy(
    wallet,
    MigrationLinker__factory,
    proposalParams
  )

  fixtureAddresses.lockupsLever = 'THERE IS NO LOCKUPS LEVER' // ensuring no confusion

  console.log('contracts')
  console.log(JSON.stringify(fixtureAddresses, null, 2))
  console.log('base contract implementations')
  console.log(JSON.stringify(implAddresses, null, 2))
  console.log('proposal address')
  console.log(proposal.address)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
