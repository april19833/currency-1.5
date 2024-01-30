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
  "policy": "0xfe9DAAdF06511F971ACCBAbFc17D66E8d27b1cd0",
  "eco": "0xf405f0a9cda5A1628AAf12aad18AbADA83B8a8E8",
  "ecox": "0xBa6Df80d505f632Fd8161094Bfdd048b607d465c",
  "ecoXStaking": "0x880f2F8759fc0fE49443A7FF3Db0A73C89fB663c",
  "ecoXExchange": "0xbA40F91f5aCed8C1f965C88fD82be27ac678d267",
  "trustedNodes": "0x6aA809bAeA2e4C057b3994127cB165119c6fc3B2",
  "monetaryGovernance": "0x588F31576C461C48bcFfded8886d2118b80D468e",
  "adapter": "0xab705e96f2A19c4a3AE935f70994f540c4b994d3",
  "lockupsLever": "0xA537756AA5E3E7EEBc3494Eb500fA31A005d0cb7",
  "lockupsNotifier": "0x536B482BC51390377ea66F385Bfe4fC0E2A93AF2",
  "rebaseLever": "0xAfEB86abfC16D02c53D996c39A0edaA024Ac61dA",
  "rebaseNotifier": "0xF92D4d8c117Fc67B5c34013e20B92BbE62abd6eE",
  "communityGovernance": "0x56Ea5Fb96AE4efA6cA24F04017fE4FbE867FA363"
}
```
