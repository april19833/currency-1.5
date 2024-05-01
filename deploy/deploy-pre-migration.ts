import { ethers } from 'hardhat'
import {
  Fixture,
  deployBaseUnproxied,
  deployCommunity,
} from './standalone.fixture'
import { ECO, ECOx } from '../typechain-types/contracts/currency'
import { Policy } from '../typechain-types/contracts/policy'
import { ECOxStaking } from '../typechain-types/contracts/governance/community'
import { SnapshotUpdatingTarget__factory } from '../typechain-types/factories/contracts/test/deploy'
import { ImplementationUpdatingTarget__factory } from '@helix-foundation/currency-dev'
import { deploy } from './utils'
import { NoMonetaryMigrationLinker__factory } from '../typechain-types/factories/contracts/test/deploy/NoMonetaryMigrationLinker.propo.sol'

const initialECOxSupply = ethers.utils.parseEther('999998146').toString()

const policyProxyAddress = '0xfdf220650F49F2b6FC215C8B7319d9c3cCc9ca0e'
const ecoProxyAddress = '0xb45b635b7621aaFB7122aB2f861F7358892Db323'
const ecoxProxyAddress = '0xad1c2075b7F1703404232f2DcB2d1e72f7855cCb'
const ecoXStakingProxyAddress = '0xE2eA415fA9d2c99B20c5CCf99F9C46F111f5dED1'

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
    governanceStartTime: Date.now(),
    termStart: Date.now(),
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

  const communityGovernanceContracts = await deployCommunity(
    wallet,
    baseContracts,
    wallet.address,
    true,
    config
  )

  const contracts = new Fixture(baseContracts, communityGovernanceContracts)
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
    implAddresses.policy,
    implAddresses.eco,
    implAddresses.ecox,
    implAddresses.ecoXStaking,
    implementationUpdatingTarget.address,
    snapshotUpdatingTarget.address,
  ]

  const proposal = await deploy(
    wallet,
    NoMonetaryMigrationLinker__factory,
    proposalParams
  )

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
