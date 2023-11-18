import { ethers } from 'hardhat'
import { testnetFixture } from './standalone.fixture'

const initialECOSupply = ethers.constants.WeiPerEther.toString()
const initialECOxSupply = ethers.constants.WeiPerEther.toString()

async function main() {
  const [wallet] = await ethers.getSigners()
  console.log(wallet.address)
  const contracts = await testnetFixture(
    [wallet.address],
    wallet.address,
    initialECOSupply,
    initialECOxSupply,
    true
  )
  console.log(JSON.stringify(contracts.toAddresses(), null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
