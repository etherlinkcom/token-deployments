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

const config: OAppOmniGraphHardhat = {
  contracts: [
    {
      contract: etherlinkTestnetContract,
    },
    {
      contract: sepoliaContract,
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
  ],
}

export default config
