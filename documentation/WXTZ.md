# WXTZ Token

## Introduction

### What is WXTZ?

WXTZ is the token created to replicate the functionality of Wrapped Ether (WETH) but specifically for the Tez (XTZ) native token on Etherlink. The goal of WXTZ is to facilitate the use of XTZ in various decentralized applications (dApps) and protocols that require ERC-20-like tokens.

### Cross-Chain Compatibility with LayerZero

To enhance the utility and reach of WXTZ, the token also implements the Omnichain Fungible Token (OFT) standard from LayerZero. This enables WXTZ to be seamlessly transferred and utilized across different blockchain networks, making it a versatile asset in the multi-chain DeFi ecosystem.

## Technical details

### Wrapping & Unwrapping Mechanisms

The token follow the `WETH9` interface for compatibility purpose for the wrapping and unwrapping mechanisms:

**FUNCTIONS**
>receive()
>fallback()
>deposit()
>withdraw(wad)
>totalSupply()
>approve(guy, wad)
>transfer(dst, wad)
>transferFrom(src, dst, wad)

**EVENTS**
>Approval(src, guy, wad)
>Transfer(src, dst, wad)
>Deposit(dst, wad)
>Withdrawal(src, wad)

### ERC20Permit

The token also implement the [ERC20Permit](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20Permit) extension from Openzeppelin. The ERC20 Permit extension allows users to approve token transfers via signatures instead of on-chain transactions, enabling gasless approvals and improving efficiency. This feature leverages the EIP-2612 standard to facilitate off-chain authorization for token transfers.

### OFT

Finally, the token inherit from the [OFT](https://docs.layerzero.network/v2/developers/evm/oft/quickstart) standard from LayerZero. The Omnichain Fungible Token (OFT) Standard allows fungible tokens to be transferred across multiple blockchains without asset wrapping or middlechains. This standard works by burning tokens on the source chain whenever an omnichain transfer is initiated, sending a message via the protocol and delivering a function call to the destination contract to mint the same number of tokens burned, creating a unified supply across all networks LayerZero supports.

## Deployment & setup

The first step is to deploy the contract on all the chains you want to support by running the LayerZero deployment tool and enter `WXTZ` as deploy script tags:
```
npx hardhat lz:deploy
```

Then, you need to `setPeer` between the tokens to create a link between them by running:
```
targetNetworkName=<TARGET_NETWORK> npx hardhat run --network <SOURCE_NETWORK> scripts/setPeer.ts
```

**NB:** 
1. You need to run this twice per connection, because each contract on both sides of the connection need to call `setPeer()`. Simply swap the source and target networks to create a link.
2. You will also have to run twice each `setPeer()` and wait for 2 days before running the second call. This is a security measure added to the token in case one of the contracts get compromised, the users will have time to bridge back their tokens before the funds get drained.

**Example of a link between Etherlink Testnet and Sepolia:**
```
targetNetworkName=sepolia npx hardhat run --network etherlinkTestnet scripts/setPeer.ts
targetNetworkName=etherlinkTestnet npx hardhat run --network sepolia scripts/setPeer.ts
```

Wait for 2 days...

```
targetNetworkName=sepolia npx hardhat run --network etherlinkTestnet scripts/setPeer.ts
targetNetworkName=etherlinkTestnet npx hardhat run --network sepolia scripts/setPeer.ts
```

Now the contracts on Etherlink Testnet and Sepolia are connected!

## Audit & Security

The contract was audited by [Omniscia.io](https://omniscia.io/), here is the link: ADD THE LINK

