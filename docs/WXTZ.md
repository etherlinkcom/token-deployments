# WXTZ

WXTZ is the token created to replicate the functionality of Wrapped Ether (WETH), but specifically for the Tez (XTZ) native token on Etherlink. The goal of WXTZ is to facilitate the use of XTZ in various decentralized applications (dApps) and protocols that require ERC-20-like tokens.

### Wrapping & Unwrapping

The token follows the `WETH9` interface for compatibility:

- **Wrapping XTZ**: The `deposit()` method can be called with XTZ attached to the message to wrap XTZ for WXTZ
- **Unwrapping XTZ**: The `withdraw(wad)` method can be called unwrap `wad` WXTZ for XTZ

**NB**: The original `WETH9` contract developed with solc version `0.4.x` also supports `fallback()`, but WXTZ does not. Supporting this hook would cause function signatures that do not match the contract's to act as if they are supported and successfully executed.

### Bridging with LayerZero OFT

WXTZ implements the [Omnichain Fungible Token (OFT)](https://docs.layerzero.network/v2/developers/evm/oft/quickstart) standard from LayerZero. This allows WXTZ to be bridged in a secure and capital efficient way across different chains through direct minting and burning of the supply.

You can find a complete overview of the configuration in the `WXTZ_fullConfig.log` file.

### Gasless Approval with ERC20Permit

The token also implements the [ERC20Permit](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20Permit) standard from Openzeppelin. This allows users to approve token transfers via gasless signatures instead of on-chain transactions. 

This feature leverages the [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) standard to facilitate off-chain authorization for token transfers.


## Deployment & setup

The first step is to deploy the contract on all the chains you want to support. To do so, run the LayerZero deployment tool, and use `WXTZ` as the deployment tag:
```
npx hardhat lz:deploy
```

### Peer

Then, you need to create a link between the contracts by running `setPeer()`. We created a script to make this easier:
```
targetNetworkName=<TARGET_NETWORK> npx hardhat run --network <SOURCE_NETWORK> scripts/setPeer.ts
```

> 🚨🚨 **NOTE** 🚨🚨
> 
> Each `setPeer()` registers a one way connection between the contract on chain A and the contract on chain B. To create a link, you'll need to run the script twice by swapping the source and target networks.
>
> For security purposes, there is a 2 day timelock when you call `setPeer()`. Therefore, for each one-way connection, you'll need to run the script twice with a 2 day delay between calls.

### Config (optionnal)

You can also setup the config of the token. The WXTZ config was setup by the Etherlink team manually because the default config on the pathways including Etherlink is not setup yet, the script used is for the moment private. If you want to apply the default config (if this default config has been setup by LayerZero on the pathway), you can use the `applyDefaultConfig.ts` script. You would need to modify it so that the script uses your OFT. Note that this script is doing the 2 sides of the pathway (e.g. Etherlink <> Ethereum AND Ethereum <> Etherlink). If you want to run it:
```
targetNetworkName=<TARGET_NETWORK> npx hardhat run --network <SOURCE_NETWORK> scripts/applyDefaultConfig.ts
```

> 🚨🚨 **NOTE** 🚨🚨
> 
> For Etherlink, the block confirmation number is set to 1 because we know that the DVNs used in our config are running **a high latency node**. Be careful though; if you set up a number too low for the chain and the DVNs are using classic nodes, it could lead to money lost.

### Options

Another important point is the "option" part. You have to specify the amount of gas you will use on the destination chain. We enforced that option on all the pathways for the WXTZ so you don't have to worry about. Here is the [LayerZero official documentation](https://docs.layerzero.network/v2/developers/evm/protocol-gas-settings/options) about this subject.

You can enforce the option by running:
```
targetNetworkName=<TARGET_NETWORK> npx hardhat run --network <SOURCE_NETWORK> scripts/setEnforcedOption.ts
```

> 🚨🚨 **NOTE** 🚨🚨
> 
> The gas calculation is different on Etherlink so you will have to rise the gas amount for the option compare to the other EVM chains.

### Debug

If you want to check all the information about your OFT, you can use the `getFullConfig.ts` script. First you need to modify the addresses, the chains and the providers in the script. Then you can run it:
```
npx hardhat run scripts/getFullConfig.ts >> WXTZ_fullConfig_after.log
```

This will generate a `WXTZ_fullConfig_after.log` with the complete setup of your OFT including the configuration, the enforced options, the libraries, etc.

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

## Tests

If you want to run the tests for the WXTZ:
```
npx hardhat test test/WXTZ.test.ts
```

**NB:** we do not test the OFT part here except for some basic errors because we can't easily reproduce a multi-chain setup with on one side Etherlink and on the other side a non-etherlink chain in hardhat tests.

But if you need to do a real test to be sure the contracts are well connected on the different chains, you can run a script to send a token like this:
```
targetNetworkName=<TARGET_NETWORK> npx hardhat run --network etherlink scripts/sendToken.ts
```

## Audit & Security

The contract was audited by [Omniscia.io](https://omniscia.io/). You can find the final report here: https://omniscia.io/reports/etherlink-cross-chain-token-665c8ac479e20900180f383b.

The OFT configuration and setup part has been audited by Inference. You can find it here: ADD LINK.

We decided to make WXTZ an OFT to enable easily cross-chain compatibility. However, if the OFT bridge gets compromised, all the XTZ in the contract on Etherlink could be stolen by a malicious attacker as follows:

1. Create and deploy a fake WXTZ contract on another EVM chain
2. Mint a maximum amount of WXTZ on the other chain
3. Connect to the contract on Etherlink using `setPeer()`
4. Transfer the WXTZ to Etherlink
5. Withdraw the XTZ locked in the WXTZ contract on Etherlink

We have taken measures to protect users native to Etherlink and bridged across EVM chains:

### Etherlink Users

We overrode the `_credit` method used by LayerZero to bridge tokens between chains. We added a condition checking that the receiving amount of WXTZ can't exceed the amount of XTZ stored in the contract. The result is that **only the WXTZ supply bridged** using the LayerZero protocol should be at risk, and not the local WXTZ on Etherlink. If an attacker succeeds in hacking the bridge, he will only be able to transfer the difference between the amount of XTZ stored in the contract and the local total supply of WXTZ on Etherlink. So all the users on Etherlink who own their WXTZ locally will still have their WXTZ backed 1:1 by an XTZ in the contract.

### Bridged Users

As a backup, we also overrode the `setPeer()` method used to connect or disconnect WXTZ contracts on different chains. By adding a **2 day timelock** to the `setPeer()` method, there is a 2 day delay between initially creating a connection and the connection being excecuted. If a hacker takes ownership of the contracts and starts connecting or disconnecting, bridged users will have **2 days to bridge back** all their funds on Etherlink and withdraw their XTZ.

### General

Whether the WXTZs are bridged or not, this token, like all the other tokens on Etherlink, relies on the fact that at least one honest operator is monitoring the Etherlink chain to secure it. You can find all the information around the current operators and how to become one in the [official documentation](https://docs.etherlink.com/network/operators).

## Helpers

We added some scripts at the root of the project (for the moment all related to the WXTZ to facilitate his deployment and setup):
- `mapWXTZ.sh` - use to generate a file with all the details of the pathways
- `fullMesh.sh` - use to setPeer the different WXTZ on all the pathways
- `setEnforcedOption.sh` - use to enforce the option on the WXTZ on all the pathways
- `applyDefaultConfig.sh` - use to apply the default config on the WXTZ, apply the send and receive libraries and the default config on them (Security stack and Executor)