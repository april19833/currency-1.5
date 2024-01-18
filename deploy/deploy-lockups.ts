import { ethers } from 'hardhat'
import { BaseContracts, deployLockups, } from './standalone.fixture'
import { ECO } from '../typechain-types/contracts/currency'
import { Policy } from '../typechain-types/contracts/policy'
import { deploy } from './utils'
import { DAY } from '../test/utils/constants'
import { LockupLinker__factory } from '../typechain-types/factories/contracts/test/deploy/LockupLinker.propo.sol'

const startTime = 1704926064

const policyProxyAddress = '0xafce51a3bfed22490343e25f66b10bd8677e22b9'
const ecoProxyAddress = '0x3e87d4d9e69163e7590f9b39a70853cf25e5abe3'
const ecoxProxyAddress = '0x9bf228552f5a9eb626529cd5f96dfecdde5ca5a9'
const ecoXStakingProxyAddress = '0xdea3e9dedeeaa6a9546c7a5604d07b59b31b552a'
const monetaryPolicyAdapterAddress = '0x1ce0C81dA5Ea006cB886CfF3dAcc7069316d1891'

async function main() {
  const [wallet] = await ethers.getSigners()
  console.log(wallet.address)

  const config = {
    verify: true,
    policyProxyAddress,
    ecoProxyAddress,
    ecoxProxyAddress,
    ecoXStakingProxyAddress,
    governanceStartTime: startTime,
    termStart: startTime,
    trusteeTerm: 7*DAY,
    lockupDepositWindow: 300, // 5 minutes
  }

  const baseContracts = new BaseContracts(
    { address: policyProxyAddress } as unknown as Policy,
    { address: ecoProxyAddress } as unknown as ECO,
    ethers.constants.AddressZero, // ECOx unneeded
    ethers.constants.AddressZero, // ECOxStaking unneeded
    ethers.constants.AddressZero // EcoExchange unneeded
  )

  const lockups = await deployLockups(wallet, baseContracts, true, config)

  const proposal = await deploy(wallet, LockupLinker__factory, [
    lockups.lockupsNotifier.address,
    monetaryPolicyAdapterAddress,
  ])

  console.log(`lockup address: ${lockups.lockupsLever.address}`)
  console.log(`notifier address: ${lockups.lockupsNotifier.address}`)
  console.log(`proposal address: ${proposal.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
