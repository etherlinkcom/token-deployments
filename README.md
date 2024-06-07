# Token Deployments

This repo contains token contracts to be deployed on Etherlink Mainnet by the Etherlink team. This project is a hardhat project built on the [template](https://docs.layerzero.network/v2/developers/evm/create-lz-oapp/start) provided by LayerZero.

The token deployments, including addresses, can be found under `deployments/` and are summarized as follows:
- `WXTZ`: Wrapped XTZ, exchange XTZ for WXTZ 1:1 on Etherlink. This should be deployed as a [classic OFT](#classic-ofts).
- `tzBTC`: Wrapped BTC, the contract owner can influence the supply of the token on Etherlink. This should be deployed as a [custom OApp](#custom-oapps).

## Module Guide

- `contracts/`: Solidity smart contracts for tokens
- `deploy/`: Deployment scripts for the solidity contracts
- `deployments/`: Deployment addresses of contracts per network
- `scripts/`: Typescript helpers and utilities
- `test/`: Tests for the contracts
- `documentation/`: Documentation of the contracts

## Setup

First, you should create and populate a `.env` file to set your environment variables as in `.env.example`. You can set either your wallet private key or mnemonic, for example:

```
PRIVATE_KEY="YOUR_PRIVATE_KEY"
```

To install project dependencies, run:

```
npm install
```

## Quick Start

To compile and test the contracts run the following:

```
npx hardhat compile
npx hardhat test
```

## Deploy

### Classic OFTs

If the contract is an OFT, it's best to use the command provided by LayerZero and follow the steps outlined in the terminal:

```
npx hardhat lz:deploy
```

### Custom OApps

If the contract is not a classic OFT, it is recommended to deploy it manually with hardhat-deploy instead as follows:
```
npx hardhat deploy --tags <TAG_OF_DEPLOYMENT> --network <DESIRED_NETWORK>
```

## Verify

To verify your contract, run the following command:

```
npx hardhat verify <YOUR_CONTRACT_ADDRESS> --network <DESIRED_NETWORK> <YOUR_CONTRACT_CONSTRUCTOR_ARGS>
```

## WXTZ Test

### Set peer

First, you need to `setPeer()` on each OFT you deployed. To do so, run:
```
targetNetworkName=<TARGET_NETWORK> npx hardhat run --network <SOURCE_NETWORK> scripts/setPeer.ts
```

**NB:** 
1. You need to run this twice per connection, because each contract on both sides of the connection need to call `setPeer()`. Simply swap the source and target networks to create a link.
2. You will also have to run twice each `setPeer()` and wait for 2 days before running the second call. This is a security measure added to the token in case one of the contracts get compromised, the users will have time to bridge back their tokens before the funds get drained.

### Send token

Then, you can try to send a token from the source network to the target network:
```
targetNetworkName=<TARGET_NETWORK> npx hardhat run --network <SOURCE_NETWORK> scripts/sendToken.ts
```

**NB:** if you don't have any WXTZ on the source chain, you won't be able to send any. If you use Etherlink Testnet as the source network, the test will automatically mint you 1 WXTZ. This mint is only doable on Etherlink Testnet.