# WXTZ

WXTZ is the token created to replicate the functionality of Wrapped Ether (WETH), but specifically for the Tez (XTZ) native token on Etherlink. The goal of WXTZ is to facilitate the use of XTZ in various decentralized applications (dApps) and protocols that require ERC-20-like tokens.

### Wrapping & Unwrapping

The token follows the `WETH9` interface for compatibility:

- **Wrapping XTZ**: The `deposit()` method can be called with XTZ attached to the message to wrap XTZ for WXTZ
- **Unwrapping XTZ**: The `withdraw(wad)` method can be called unwrap `wad` WXTZ for XTZ

**NB**: The classic wrapper `WETH9` version `0.4.x` also support `fallback()` but we decided **to not support** it because from a security standpoint, supporting the `fallback` hook would cause function signatures that do not match the contract's to act as if they are supported and successfully executed.

### Bridging with LayerZero OFT

WXTZ implements the [Omnichain Fungible Token (OFT)](https://docs.layerzero.network/v2/developers/evm/oft/quickstart) standard from LayerZero. This allows WXTZ to be bridged in a secure and capital efficient way across different chains through direct minting and burning of the supply.

### Gasless Approval with ERC20Permit

The token also implements the [ERC20Permit](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20Permit) standard from Openzeppelin. This allows users to approve token transfers via gasless signatures instead of on-chain transactions. 

This feature leverages the [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) standard to facilitate off-chain authorization for token transfers.


## Deployment & setup

The first step is to deploy the contract on all the chains you want to support. To do so, run the LayerZero deployment tool, and use `WXTZ` as the deployment tag:
```
npx hardhat lz:deploy
```

Then, you need to create a link between the contracts by running `setPeer()`. We created a script to make this easier:
```
targetNetworkName=<TARGET_NETWORK> npx hardhat run --network <SOURCE_NETWORK> scripts/setPeer.ts
```

> 🚨🚨 **NOTE** 🚨🚨
> 
> Each `setPeer()` registers a one way connection between the contract on chain A and the contract on chain B. To create a link, you'll need to run the script twice by swapping the source and target networks.
>
> For security purposes, there is a 2 day timelock when you call `setPeer()`. Therefore, for each one-way connection, you'll need to run the script twice with a 2 day delay between calls.

### Example: Etherlink Testnet and Sepolia

The first call will initiate the timelock:

```
targetNetworkName=sepolia npx hardhat run --network etherlinkTestnet scripts/setPeer.ts
targetNetworkName=etherlinkTestnet npx hardhat run --network sepolia scripts/setPeer.ts
```

If you try to bridge tokens, the transaction will fail because of the timelock. After the timelock has expired, we can call again to create the connection.

```
targetNetworkName=sepolia npx hardhat run --network etherlinkTestnet scripts/setPeer.ts
targetNetworkName=etherlinkTestnet npx hardhat run --network sepolia scripts/setPeer.ts
```

Now the contracts on Etherlink Testnet and Sepolia are connected and tokens can be bridged with the following script:

```
targetNetworkName=<TARGET_NETWORK> npx hardhat run --network <SOURCE_NETWORK> scripts/sendToken.ts
```

**NB:** if you don't have any WXTZ on the source chain, you won't be able to send any. If you use Etherlink Testnet as the source network, the test will automatically mint you 1 WXTZ. This mint is only doable on Etherlink Testnet.

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