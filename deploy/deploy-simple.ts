import { ethers } from 'hardhat'
import { testnetFixture } from './standalone.fixture'
import { DAY } from '../test/utils/constants'

const initialECOSupply = ethers.utils.parseEther('10000000')
const initialECOxSupply = ethers.utils.parseEther('1000000')

async function main() {
  const [wallet] = await ethers.getSigners()
  console.log(wallet.address)

  const startTime = Math.round(Date.now() / 1000)

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
