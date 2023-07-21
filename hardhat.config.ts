import * as dotenv from 'dotenv'

import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'
import 'hardhat-change-network'

import '@nomiclabs/hardhat-ethers'
import '@openzeppelin/hardhat-upgrades'

dotenv.config()

const privateKey = process.env.PRIVATE_KEY || '0x' + '11'.repeat(32) // this is to avoid hardhat error
const deploy = process.env.DEPLOY_DIRECTORY || 'deploy'

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '^0.8.0',
        settings: {
          optimizer: { enabled: true, runs: 10_000 },
        },
      },
    ],
    settings: {
      metadata: {
        bytecodeHash: 'none',
      },
      outputSelection: {
        '*': {
          '*': ['metadata', 'storageLayout'],
        },
      },
    },
  },
  networks: {
    'optimism-mainnet': {
      chainId: 10,
      url: 'https://mainnet.optimism.io',
      accounts: [privateKey],
    },
    goerliOptimism: {
      chainId: 420,
      url: process.env.OPTIMISM_GOERLI_URL || '',
      gasPrice: 100,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    'base-goerli': {
      chainId: 84531,
      url: 'https://goerli.base.org',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    goerli: {
      chainId: 5,
      url: process.env.GOERLI_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      chainId: 1,
      url: process.env.CONTRACTS_RPC_URL || '',
      accounts: [privateKey],
    },
  },
  mocha: {
    timeout: 50000,
  },
  gasReporter: {
    enabled: !!process.env.ENABLE_GAS_REPORT,
    currency: 'USD',
    gasPrice: 100,
    outputFile: process.env.CI ? 'gas-report.txt' : undefined,
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      goerliOptimism: process.env.OPTIMISM_ETHERSCAN_API_KEY || '',
      goerli: process.env.ETHERSCAN_API_KEY || '',
      optimisticEthereum: process.env.OPTIMISM_ETHERSCAN_API_KEY || '',
      // Basescan doesn't require an API key, however Hardhat still expects an arbitrary string to be provided.
      'base-goerli': 'PLACEHOLDER_STRING',
    },
    customChains: [
      {
        network: 'goerliOptimism',
        chainId: 420,
        urls: {
          apiURL: 'https://api-goerli-optimism.etherscan.io/api',
          browserURL: 'https://goerli-optimism.etherscan.io',
        },
      },
      {
        network: 'base-goerli',
        chainId: 84531,
        urls: {
          apiURL: 'https://api-goerli.basescan.org/api',
          browserURL: 'https://goerli.basescan.org',
        },
      },
    ],
  },
}

export default config
