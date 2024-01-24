# Currency 1.5 Deployment

## Overview

This folder contains the deployment scripts for Currency 1.5.

## Setting your environment Variables

Copy `.env.example` to `.env` and populate the three fields

PRIVATE_KEY: The private key of the account deploying the cotnracts
RPCKEY: Your infura RPC Key
ETHERSCAN_API_KEY: Your etherscan API Key

## Deploying the contracts

### Simple Local Deployment

Start hardhat in a terminal window

```bash
npx hardhat node
```

In a second window run the deploy-simple.ts

```bash

npx hardhat run --network localhost deploy/deploy-simple.ts

```

The contract addresses will be saved in `deploy/[deployId]/addresses.json`. Contract addresses will be displayed on the terminal.
Following is a sample addresses.json file

```JSON
{
  "policy": "0x4432a6DcfAEAB227673B43C30c6fEf40eaBD5D30",
  "eco": "0x18eb8AF587dcd7E4F575040F6D800a6B5Cef6CAf",
  "ecox": "0x7c02b58029beeA7c1FcC872803dC9818f57A0E61",
  "ecoXStaking": "0xa8fcCF4D0e2f2c4451123fF2F9ddFc9be465Fa1d",
  "ecoXExchange": "0x3818eAb6Ca8Bf427222bfACFA706c514145F4104",
  "trustedNodes": "0xa95A928eEc085801d981d13FFE749872D8FD5bec",
  "monetaryGovernance": "0xAA5c5496e2586F81d8d2d0B970eB85aB088639c2",
  "adapter": "0x0aD6371dd7E9923d9968D63Eb8B9858c700abD9d",
  "lockupsLever": "0xc3b99d27eF3B07C94Ee3cFD670281F0CF98A02f1",
  "lockupsNotifier": "0x20F5f006a0184883068bBF58fb0c526A8EEa8BFD",
  "rebaseLever": "0x975cDd867aCB99f0195be09C269E2440aa1b1FA8",
  "rebaseNotifier": "0xd6096fbEd8bCc461d06b0C468C8b1cF7d45dC92d",
  "communityGovernance": "0x575D3d18666B28680255a202fB5d482D1949bB32"
}
```

### Simple TestNet Deployment (Sepolia)

Ensure you have configured your .env file with the correct key and api information for Sepolia and that you have Sepolia ETH in your account.

run the deploy-simple.ts

```bash

npx hardhat run --network sepolia deploy/deploy-simple.ts

```

The contract addresses will be saved in `deploy/[deployId]/addresses.json`. Contract addresses will be displayed on the terminal.
Following is a sample addresses.json file

```JSON
{
  "policy": "0xD62794259934aDEFa6c302BC58B550c589DB470D",
  "eco": "0x45b69ab2aD7d76463567F7325d7551cADB8ACD4D",
  "ecox": "0x2EefccD49ab84E94fC89178024ec731390887152",
  "ecoXStaking": "0xAF0dB0ccd8E238280c6c4F809cFA4a137a7dB9F8",
  "ecoXExchange": "0x0253E4Df636dd799d985f6A8Bc277B508007018b",
  "trustedNodes": "0x4CC8fEd0190Da740DeFcb8008caFCaf362F69648",
  "monetaryGovernance": "0x1d5b37750DC64c8DB5938D97d189035B5AF71bF8",
  "adapter": "0x398d175fc4332C6c19f8062D18Ad7A8C186eA410",
  "lockupsLever": "0xe6745505f8C5330694Fd5f0abD52D71e356D69F2",
  "lockupsNotifier": "0x957bDB22F6E95f188081E3fB355B14Cc21D213b3",
  "rebaseLever": "0x3F1C1806C156b8B23cb556BF22dAb40EAecC5Ca1",
  "rebaseNotifier": "0x1c613c01FB779B0209a2f8B35011724c75b623a2",
  "communityGovernance": "0x2e84076BdC4152bBC417917C9EeB2108bab224B8"
}
```
