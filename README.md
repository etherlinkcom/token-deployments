# Token Deployments

This repo contains token contracts to be deployed on Etherlink Mainnet by the Etherlink team. This project is a hardhat project built on the [template](https://docs.layerzero.network/v2/developers/evm/create-lz-oapp/start) provided by LayerZero.

The token deployments, including addresses, can be found under `deployments/` and are summarized as follows:
- `WXTZ`: Wrapped XTZ, exchange XTZ for WXTZ 1:1 on Etherlink. This should be deployed as a [classic OFT](#classic-ofts).
- `tzBTC`: Wrapped BTC, the contract owner can influence the supply of the token on Etherlink. This should be deployed as a [custom OApp](#custom-oapps).

## Module Guide

- `contracts/`: Solidity smart contracts for tokens
- `deploy/`: Deployment scripts for the solidity contracts
- `deployments/`: deployment addresses of contracts per network
- `scripts/`: Typescript helpers and utilities
- `test/`: Tests for the contracts

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
npx hardhat verify <YOUR_CONTRACT_ADDRESS> <YOUR_CONTRACT_CONSTRUCTOR_ARGS> --network <DESIRED_NETWORK>
```

For now, only testnet is supported, so you should use `--network etherlinkTestnet` or any other testnet defined in the `hardhat.config.ts`.

## Test of WXTZ

### Set peer

First, you need to set peer on each OFT you deployed. To do so, run:
```
targetNetworkName=<target-network> npx hardhat run --network <actual-network> scripts/setPeer.ts
```

**Remember to do it at least twice (and change the target-network by the actual-network and vice-versa) because you have to set peer on each chain to create the link between them.**

### Send token

Then, you can try to send a token from the actual chain to the targeted chain:
```
targetNetworkName=<target-network> npx hardhat run --network <actual-chain> scripts/sendToken.ts
```

**Important: if you don't have any WXTZ on the actual chain, you won't be able to send it. If you use etherlink testnet as actual network the test will automatically mint you one. This mint is only doable on etherlink testnet.**