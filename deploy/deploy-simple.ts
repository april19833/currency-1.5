import { ethers } from 'hardhat'
import { testnetFixture } from './standalone.fixture'
import { DAY } from '../test/utils/constants'

const initialECOSupply = ethers.constants.WeiPerEther.toString()
const initialECOxSupply = ethers.constants.WeiPerEther.toString()

const startTime = 1706058264914

async function main() {
  const [wallet] = await ethers.getSigners()
  console.log(wallet.address)
  const contracts = await testnetFixture(
    [wallet.address],
    wallet.address,
    initialECOSupply,
    initialECOxSupply,
    true,
    {
      governanceStartTime: startTime,
      termStart: startTime,
      trusteeTerm: 7 * DAY,
      lockupDepositWindow: 300,
      verify: true,
    }
  )
  console.log(JSON.stringify(contracts.toAddresses(), null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
