// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
import 'dotenv/config'

import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-ethers'
import '@layerzerolabs/toolbox-hardhat'
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-chai-matchers";
import "@openzeppelin/hardhat-upgrades";
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

// Set your preferred authentication method
//
// If you prefer using a mnemonic, set a MNEMONIC environment variable
// to a valid mnemonic
const MNEMONIC = process.env.MNEMONIC

// If you prefer to be authenticated using a private key, set a PRIVATE_KEY environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
  ? { mnemonic: MNEMONIC }
  : PRIVATE_KEY
    ? [PRIVATE_KEY]
    : undefined

if (accounts == null) {
  console.warn(
    'Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.'
  )
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.22',
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.4.18',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      gasPrice: 0,
      initialBaseFeePerGas: 0,
      chainId: 128123 // override the chain id because some contract have restricted functionalities on other chain
    },
    sepolia: {
      eid: EndpointId.SEPOLIA_V2_TESTNET,
      url: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org/',
      chainId: 11155111,
      accounts,
    },
    etherlinkTestnet: {
      eid: EndpointId.ETHERLINK_V2_TESTNET,
      url: process.env.ETHERLINK_TESTNET_RPC_URL || "https://node.ghostnet.etherlink.com",
      chainId: 128123,
      accounts,
    },
    bscTestnet: {
      eid: EndpointId.BSC_V2_TESTNET,
      url: process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet.publicnode.com",
      chainId: 97,
      accounts,
    },
    etherlink: {
      eid: EndpointId.ETHERLINK_V2_MAINNET,
      url: process.env.ETHERLINK_RPC_URL || "https://node.mainnet.etherlink.com",
      chainId: 42793,
      accounts,
    },
    mainnet: {
      eid: EndpointId.ETHEREUM_V2_MAINNET,
      url: process.env.ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com",
      chainId: 1,
      accounts,
    },
    arbitrumOne: {
      eid: EndpointId.ARBITRUM_V2_MAINNET,
      url: process.env.ARBITRUM_ONE_RPC_URL || "https://arbitrum-one-rpc.publicnode.com",
      chainId: 42161,
      accounts,
    },
    base: {
      eid: EndpointId.BASE_V2_MAINNET,
      url: process.env.BASE_RPC_URL || "https://base-rpc.publicnode.com",
      chainId: 8453,
      accounts,
    },
    bsc: {
      eid: EndpointId.BSC_V2_MAINNET,
      url: process.env.BSC_RPC_URL || "https://bsc-rpc.publicnode.com",
      chainId: 56,
      accounts,
    }
  },
  namedAccounts: {
    deployer: {
      default: 0, // wallet address of index[0], of the mnemonic in .env
    },
  },
  etherscan: {
    apiKey: {
      etherlinkTestnet: "YOU_CAN_COPY_ME",
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      etherlink: "YOU_CAN_COPY_ME",
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "etherlinkTestnet",
        chainId: 128123,
        urls: {
          apiURL: "https://testnet-explorer.etherlink.com/api",
          browserURL: "https://testnet-explorer.etherlink.com"
        }
      },
      {
        network: "etherlink",
        chainId: 42793,
        urls: {
          apiURL: "https://explorer.etherlink.com/api",
          browserURL: "https://explorer.etherlink.com"
        }
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/"
        }
      }
    ]
  }
}

export default config
