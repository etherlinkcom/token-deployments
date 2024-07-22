import { EndpointId, ChainKey, EndpointVersion, networkToEndpointId } from '@layerzerolabs/lz-definitions'

import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

// const etherlinkTestnetContract: OmniPointHardhat = {
//   eid: EndpointId.ETHERLINK_V2_TESTNET,
//   contractName: "WXTZ"
// }

// const sepoliaContract: OmniPointHardhat = {
//   eid: EndpointId.SEPOLIA_V2_TESTNET,
//   contractName: 'WXTZ',
// }

// const bscTestnetContract: OmniPointHardhat = {
//   eid: EndpointId.BSC_V2_TESTNET,
//   contractName: 'WXTZ',
// }


/////// MAINNET /////////
const etherlink: OmniPointHardhat = {
  eid: EndpointId.ETHERLINK_V2_MAINNET,
  contractName: 'WXTZ',
}

const mainnet: OmniPointHardhat = {
  eid: EndpointId.ETHEREUM_V2_MAINNET,
  contractName: 'WXTZ',
}

const arbitrumOne: OmniPointHardhat = {
  eid: EndpointId.ARBITRUM_V2_MAINNET,
  contractName: 'WXTZ',
}

const base: OmniPointHardhat = {
  eid: EndpointId.BASE_V2_MAINNET,
  contractName: 'WXTZ',
}

const bsc: OmniPointHardhat = {
  eid: EndpointId.BSC_V2_MAINNET,
  contractName: 'WXTZ',
}

const config: OAppOmniGraphHardhat = {
  contracts: [
    { contract: etherlink },
    { contract: mainnet },
    { contract: arbitrumOne },
    { contract: base },
    { contract: bsc },
  ],
  connections: [
    {
      from: etherlink, to: base,
      config: {
        // Required Send library on etherlink
        sendLibrary: "0x7cacBe439EaD55fa1c22790330b12835c6884a91",
        receiveLibraryConfig: {
          // Required Receive Library Address on etherlink
          receiveLibrary: "0x282b3386571f7f794450d5789911a9804FA346b4",
          gracePeriod: BigInt(0)
        },
        sendConfig: {
          executorConfig: {
            maxMessageSize: 99,
            // The configured Executor address on etherlink
            executor: "0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e",
          },
          ulnConfig: {
            // The number of block confirmations to wait on etherlink before emitting the message from the source chain (etherlink).
            confirmations: BigInt(2),
            // The address of the DVNs you will pay to verify a sent message on the source chain (etherlink).
            // The destination tx will wait until ALL `requiredDVNs` verify the message.
            requiredDVNs: [
              "0x7a23612f07d81f16b26cf0b5a4c3eca0e8668df2",
              "0xc097ab8CD7b053326DFe9fB3E3a31a0CCe3B526f"
            ],
            // The address of the DVNs you will pay to verify a sent message on the source chain (etherlink).
            // The destination tx will wait until the configured threshold of `optionalDVNs` verify a message.
            optionalDVNs: [],
            // The number of `optionalDVNs` that need to successfully verify the message for it to be considered Verified.
            optionalDVNThreshold: 0,
          },
        },
        // Optional Receive Configuration
        // @dev Controls how the `from` chain receives messages from the `to` chain.
        receiveConfig: {
          ulnConfig: {
            // The number of block confirmations to expect from the `to` chain (base).
            confirmations: BigInt(2),
            // The address of the DVNs your `receiveConfig` expects to receive verifications from on the `from` chain (etherlink).
            // The `from` chain's OApp will wait until the configured threshold of `requiredDVNs` verify the message.
            requiredDVNs: [
              "0x7a23612f07d81f16b26cf0b5a4c3eca0e8668df2",
              "0xc097ab8CD7b053326DFe9fB3E3a31a0CCe3B526f",
            ],
            // The address of the `optionalDVNs` you expect to receive verifications from on the `from` chain (etherlink).
            // The destination tx will wait until the configured threshold of `optionalDVNs` verify the message.
            optionalDVNs: [],
            // The number of `optionalDVNs` that need to successfully verify the message for it to be considered Verified.
            optionalDVNThreshold: 0,
          },
        },
      }
    },
    {
      from: base, to: etherlink,
      config: {
        // Required Send library on base
        sendLibrary: "0x9DB3714048B5499Ec65F807787897D3b3Aa70072",
        receiveLibraryConfig: {
          // Required Receive Library Address on base
          receiveLibrary: "0x58D53a2d6a08B72a15137F3381d21b90638bd753",
          gracePeriod: BigInt(0)
        },
        sendConfig: {
          executorConfig: {
            maxMessageSize: 99,
            // The configured Executor address on base
            executor: "0x2CCA08ae69E0C44b18a57Ab2A87644234dAebaE4",
          },
          ulnConfig: {
            // The number of block confirmations to wait on base before emitting the message from the source chain (base).
            confirmations: BigInt(2),
            // The address of the DVNs you will pay to verify a sent message on the source chain (base).
            // The destination tx will wait until ALL `requiredDVNs` verify the message.
            requiredDVNs: [
              "0x9e059a54699a285714207b43B055483E78FAac25",
              "0xcd37CA043f8479064e10635020c65FfC005d36f6"
            ],
            // The address of the DVNs you will pay to verify a sent message on the source chain (base).
            // The destination tx will wait until the configured threshold of `optionalDVNs` verify a message.
            optionalDVNs: [],
            // The number of `optionalDVNs` that need to successfully verify the message for it to be considered Verified.
            optionalDVNThreshold: 0,
          },
        },
        // Optional Receive Configuration
        // @dev Controls how the `from` chain receives messages from the `to` chain.
        receiveConfig: {
          ulnConfig: {
            // The number of block confirmations to expect from the `to` chain (etherlink).
            confirmations: BigInt(2),
            // The address of the DVNs your `receiveConfig` expects to receive verifications from on the `from` chain (etherlink).
            // The `from` chain's OApp will wait until the configured threshold of `requiredDVNs` verify the message.
            requiredDVNs: [
              "0x9e059a54699a285714207b43B055483E78FAac25",
              "0xcd37CA043f8479064e10635020c65FfC005d36f6"
            ],
            // The address of the `optionalDVNs` you expect to receive verifications from on the `from` chain (etherlink).
            // The destination tx will wait until the configured threshold of `optionalDVNs` verify the message.
            optionalDVNs: [],
            // The number of `optionalDVNs` that need to successfully verify the message for it to be considered Verified.
            optionalDVNThreshold: 0,
          },
        },
      }
    },
    // { from: etherlink, to: mainnet },
    // { from: mainnet, to: etherlink },
    // { from: etherlink, to: arbitrumOne },
    // { from: arbitrumOne, to: etherlink },
    // { from: etherlink, to: base },
    // { from: base, to: etherlink },
    // { from: etherlink, to: bsc },
    // { from: bsc, to: etherlink },
  ],
}

export default config