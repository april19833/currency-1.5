import { ethers } from 'hardhat'
import { Fixture, deployBaseUnproxied, deployCommunity, deployMonetary } from './standalone.fixture'
import { ECO, ECOx } from '../typechain-types/contracts/currency'
import { Policy } from '../typechain-types/contracts/policy'
import { ECOxStaking } from '../typechain-types/contracts/governance/community'
import { MigrationLinker__factory } from '../typechain-types/factories/contracts/test/deploy/MigrationLinker.propo.sol'
import { InflationMultiplierUpdatingTarget__factory } from '../typechain-types/factories/contracts/test/deploy'
import { ImplementationUpdatingTarget__factory } from '@helix-foundation/currency-dev'
import { deploy } from './utils'

const initialECOxSupply = ethers.utils.parseEther('10000000000').toString() // CHECK ME

const policyProxyAddress = '0x8c02D4cc62F79AcEB652321a9f8988c0f6E71E68'
const ecoProxyAddress = '0x8dBF9A4c99580fC7Fd4024ee08f3994420035727'
const ecoxProxyAddress = '0xcccD1Ba9f7acD6117834E0D28F25645dECb1736a'
const ecoXStakingProxyAddress = '0x3a16f2Fee32827a9E476d0c87E454aB7C75C92D7'

const trustee1Address = '0xA21575eE3E8866187942839cBCf4928036F93A03'
const trustee2Address = '0x22997bF1A122839138ef728088D089ed585AEf0D'

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
  baseContracts.ecoXStaking = { address: ecoXStakingProxyAddress } as unknown as ECOxStaking

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

  const contracts = new Fixture(baseContracts, monetaryGovernanceContracts, communityGovernanceContracts)
  const fixtureAddresses = contracts.toAddresses()

  console.log('deploying linker')

  const implementationUpdatingTarget = await deploy(
    wallet,
    ImplementationUpdatingTarget__factory
  )

  const inflationMultiplierUpdatingTarget = await deploy(
    wallet,
    InflationMultiplierUpdatingTarget__factory
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
    inflationMultiplierUpdatingTarget.address,
  ]

  const proposal = (await deploy(
    wallet,
    MigrationLinker__factory,
    proposalParams
  ))

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
