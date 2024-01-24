import { run } from 'hardhat'

const buildNumber = '1706058371964'

const addresses = require(`./deployments/${buildNumber}/addresses.json`)
const baseImplementationAddresses = require(`./deployments/${buildNumber}/baseImplementationAddresses.json`)
const baseDeployParams = require(`./deployments/${buildNumber}/baseDeployParams.json`)
const monetaryDeployParams = require(`./deployments/${buildNumber}/monetaryDeployParams.json`)
const communityDeployParams = require(`./deployments/${buildNumber}/communityDeployParams.json`)

const deployParams = {
  ...baseDeployParams,
  ...monetaryDeployParams,
  ...communityDeployParams,
}

async function main() {
  addresses.policy = baseImplementationAddresses.policyImplementation
  addresses.eco = baseImplementationAddresses.ecoImplementation
  addresses.ecox = baseImplementationAddresses.ecoxImplementation
  addresses.ecoXStaking = baseImplementationAddresses.ecoXStakingImplementation

  const contractNames = Object.keys(addresses)

  for (const contractName of contractNames) {
    await run('verify:verify', {
      address: addresses[contractName],
      constructorArguments: deployParams[`${contractName}Params`],
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
