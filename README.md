# Token Deployments

This repo contains token contracts to be deployed on Etherlink Mainnet by the Etherlink team. This project is a hardhat project built on the [template](https://docs.layerzero.network/v2/developers/evm/create-lz-oapp/start) provided by LayerZero.

The token deployments, including addresses, can be found under `deployments/` and are summarized as follows:
- WXTZ: Wrapped XTZ, emulating WETH on Ethereum mainnet.

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

If the contract is an OFT (for now, all tokens are OFTs!), it's best to use the command provided by LayerZero and follow the steps outlined in the terminal:

```
npx hardhat lz:deploy
```

## Verify

To verify your contract, run the following command:

```
npx hardhat verify <YOUR_CONTRACT_ADDRESS> <YOUR_CONTRACT_CONSTRUCTOR_ARGS> --network <DESIRED_NETWORK>
```

For now, only testnet is supported, so you should use `--network etherlinkTestnet`.