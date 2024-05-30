import { EndpointId } from '@layerzerolabs/lz-definitions'

import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const etherlinkTestnetContract: OmniPointHardhat = {
  eid: EndpointId.ETHERLINK_V2_TESTNET,
  contractName: "WXTZToken"
}

const sepoliaContract: OmniPointHardhat = {
  eid: EndpointId.SEPOLIA_V2_TESTNET,
  contractName: 'WXTZToken',
}

const bscTestnetContract: OmniPointHardhat = {
  eid: EndpointId.BSC_V2_TESTNET,
  contractName: 'WXTZToken',
}

const config: OAppOmniGraphHardhat = {
  contracts: [
    {
      contract: etherlinkTestnetContract,
    },
    {
      contract: sepoliaContract,
    },
    {
      contract: bscTestnetContract,
    },
  ],
  connections: [
    {
      from: etherlinkTestnetContract,
      to: sepoliaContract,
    },
    {
      from: sepoliaContract,
      to: etherlinkTestnetContract,
    },
    {
      from: etherlinkTestnetContract,
      to: bscTestnetContract,
    },
    {
      from: bscTestnetContract,
      to: etherlinkTestnetContract,
    },
  ],
}

export default config
