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

**NB**: The classic wrapper WETH9 version 0.4.x also support `fallback()` but we decided **to not support** it because from a security standpoint, supporting the `fallback` hook would cause function signatures that do not match the contract's to act as if they are supported and successfully executed.

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

### Note

We decided to make the wrapper of the native token XTZ an OFT to enable easily cross-chain compatibility. But inevitably, it does come with additional risks of security that we identified and reduced:

#### 1. Local WXTZ

The local WXTZ are at risk because of the bridging system, if it gets compromised, all the XTZ in the contract on Etherlink could be stolen by a malicious attacker who connects a fake WXTZ with an infinite amount of funds on a new chain and then transfers everything on Etherlink to withdraw all the XTZ.

**Solution:** We overrided the `_credit` method used by LayerZero to bridge tokens between chains. We added a condition checking that the receiving amount of WXTZ can't exceed the amount of XTZ stored in the contract. The result is that **only the WXTZ supply bridged** using the LayerZero protocol should be at risk, and not the local ones on Etherlink. If an attacker succeeds in hacking the bridge, he will only be able to transfer the difference between the amount of XTZ stored in the contract and the local total supply of WXTZ on Etherlink. So all the users on Etherlink who own their WXTZ locally will still have their WXTZ backed 1:1 by an XTZ in the contract.

#### 2. Bridged WXTZ

As explained above, only the bridged WXTZ detained by the users on other connected chains should be at risk if the bridging system gets hacked. Still, we decided to add a mechanism to add a "backup" to protect users if this situation happens.

**Solution:** We overrided the `setPeer` method used to connect or disconnect the different WXTZ contracts on different chains. We simply added a **2-day delay** between the first call of the set peer and the real execution of the method. If a hacker takes ownership of the contracts and starts connecting or disconnecting them, the users will have **2 days to bridge back** all their funds on Etherlink to be safe. It comes with a 2-day delay for us if we want to initially set up or add a new chain to the cross-chain system, but this drawback is worth the users security.

By adding these two protections, we protect the users who are not using the bridge/omni-chain system, and we give a 2-day delay to all the WXTZ owners on other chains to bridge back their WXTZ on Etherlink in the worst scenario where the multisignature managing the bridging system gets compromised.