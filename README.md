# Token Deployments

This repo contains token contracts to be deployed on Etherlink Mainnet by the Etherlink team. This project is a hardhat project built on the [template](https://docs.layerzero.network/v2/developers/evm/create-lz-oapp/start) provided by LayerZero.

The token deployments, including addresses, can be found under `deployments/` and are summarized as follows:

- `WXTZ`: Wrapped XTZ, exchange XTZ for WXTZ 1:1 on Etherlink. This should be deployed as a [classic OFT](#classic-ofts).
- `tzBTC`: Wrapped BTC, the contract owner can influence the supply of the token on Etherlink. This should be deployed as a [custom OApp](#custom-oapps).

## Deployments

### Mainnets

| Network | Chain ID | Contract | Address |
| --- | --- | --- | --- |
| Etherlink | 42793 | `WXTZ` | [`0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb`](https://explorer.etherlink.com/address/0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb) |
| Ethereum | 1 | `WXTZ` | [`0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb`](https://etherscan.io/address/0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb) |
| Arbitrum One | 42161 | `WXTZ` | [`0x7424f00845777A06E21F0bd8873f814A8A814B2D`](https://arbiscan.io/address/0x7424f00845777A06E21F0bd8873f814A8A814B2D) |
| Base | 8453 | `WXTZ` | [`0x91F9cc2649ac70a071602cadE9b0C1A5868af51D`](https://basescan.org/address/0x91F9cc2649ac70a071602cadE9b0C1A5868af51D) |
| BNB Smart Chain | 56 | `WXTZ` | [`0x91F9cc2649ac70a071602cadE9b0C1A5868af51D`](https://bscscan.com/address/0x91F9cc2649ac70a071602cadE9b0C1A5868af51D) |

### Testnets

| Network | Chain ID | Contract | Address |
| --- | --- | --- | --- |
| Etherlink Testnet (Ghostnet) | 128123 | `WXTZ` | [`0x40fAfA2E6b2F0734caDDC0a1c572D3BCeABa5313`](https://testnet-explorer.etherlink.com/address/0x40fAfA2E6b2F0734caDDC0a1c572D3BCeABa5313) |
| Etherlink Testnet (Ghostnet) | 128123 | `tzBTCTokenProxy` | [`0xEa5e33525D44dbc4cD4598202AD99f077c58be15`](https://testnet-explorer.etherlink.com/address/0xEa5e33525D44dbc4cD4598202AD99f077c58be15) |
| Etherlink Testnet (Ghostnet) | 128123 | `tzBTCTokenImplem` | [`0x492e4bD1395080B6F6A517e29392C82FAcecc887`](https://testnet-explorer.etherlink.com/address/0x492e4bD1395080B6F6A517e29392C82FAcecc887) |
| Etherlink Testnet (Ghostnet) | 128123 | `tzBTCAdapter` | [`0x632E0216ed9a71b257DD00B79b056231040aBD6a`](https://testnet-explorer.etherlink.com/address/0x632E0216ed9a71b257DD00B79b056231040aBD6a) |
| Etherlink Shadownet | 127823 | `WXTZ` | [`0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb`](https://shadownet.explorer.etherlink.com/address/0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb) |
| Sepolia | 11155111 | `WXTZ` | [`0x5E51503409Acf2457C5cEf6c1DFb0e3F6330fD65`](https://sepolia.etherscan.io/address/0x5E51503409Acf2457C5cEf6c1DFb0e3F6330fD65) |
| BSC Testnet | 97 | `WXTZ` | [`0x66b48b4b33d075f6c87699ad4e669355d2794f39`](https://testnet.bscscan.com/address/0x66b48b4b33d075f6c87699ad4e669355d2794f39) |
| TezosX Previewnet&nbsp;[*](#tezosx-previewnet-stub) | 128064 | `WXTZ` | [`0xf4a2e3BA5C14f11c23c8c4351093C058D20542f2`](https://blockscout.previewnet.tezosx.nomadic-labs.com/address/0xf4a2e3BA5C14f11c23c8c4351093C058D20542f2) |
| TezosX Previewnet&nbsp;[*](#tezosx-previewnet-stub) | 128064 | `EndpointV2Stub` | [`0xF01b3160F2926420C7416ddA62544969063269ED`](https://blockscout.previewnet.tezosx.nomadic-labs.com/address/0xF01b3160F2926420C7416ddA62544969063269ED) |

#### TezosX Previewnet stub

TezosX Previewnet is an ephemeral chain (≈1–2 month lifespan) and has no LayerZero infrastructure. To deploy the unmodified `WXTZ` contract there, a minimal `EndpointV2Stub` (see [`contracts/mocks/tezosXPreviewnet/`](contracts/mocks/tezosXPreviewnet/)) is deployed first and registered under the `EndpointV2` deployment name so `OAppCore`'s constructor call to `setDelegate` succeeds. Cross-chain `send`/`lzReceive` do not work on previewnet; local `deposit`/`withdraw` and the full ERC20/permit surface do. The stub and its deploy script ([`deploy/tezosXPreviewnet/`](deploy/tezosXPreviewnet/)) are scoped to that network via a `skip` guard, and should be removed when previewnet is decommissioned.

## Module Guide

- `docs/`: Documentation of the tokens
- `contracts/`: Solidity smart contracts for tokens
- `deploy/`: Deployment scripts for the solidity contracts
- `deployments/`: Deployment addresses of contracts per network
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
npx hardhat verify <YOUR_CONTRACT_ADDRESS> --network <DESIRED_NETWORK> <YOUR_CONTRACT_CONSTRUCTOR_ARGS>
```

## Audits and Security

Please refer to the `Audit and Security` sections for each of the respective under `docs/`.
