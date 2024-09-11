import { ethers, network } from 'hardhat';
import etherlinkTestnetTokens from '../deployments/etherlinkTestnet.json';
import sepoliaTokens from '../deployments/sepolia.json';
import bscTestnetTokens from '../deployments/bscTestnet.json';
import etherlinkTokens from '../deployments/etherlink.json';
import mainnetTokens from '../deployments/mainnet.json';
import arbitrumOneTokens from '../deployments/arbitrumOne.json';
import baseTokens from '../deployments/base.json';
import bscTokens from '../deployments/bsc.json';
import { customFormatBytes32String } from './utils';
import { Options } from '@layerzerolabs/lz-v2-utilities';

const endpointIds: { [key: string]: string } = {
  sepolia: '40161',
  bscTestnet: '40102',
  avalancheFujiTestnet: '40106',
  polygonMumbai: '40109',
  arbitrumSepolia: '40231',
  optimismSepolia: '40232',
  etherlinkTestnet: '40239',
  etherlink: '30292',
  mainnet: '30101',
  arbitrumOne: '30110',
  base: '30184',
  bsc: '30102',
  avalanche: '30106',
  polygon: '30109',
  optimisticEthereum: '30111',
};

async function main() {
  const [owner] = await ethers.getSigners();
  // current network
  const networkName = network.name;
  // targeted network
  const targetNetworkName = process.env.targetNetworkName || "";
  const WXTZDeployed: { [key: string]: string } = {
    etherlinkTestnet: etherlinkTestnetTokens.WXTZ,
    sepolia: sepoliaTokens.WXTZ,
    bscTestnet: bscTestnetTokens.WXTZ,
    etherlink: etherlinkTokens.WXTZ,
    mainnet: mainnetTokens.WXTZ,
    arbitrumOne: arbitrumOneTokens.WXTZ,
    base: baseTokens.WXTZ,
    bsc: bscTokens.WXTZ
  };
  const WXTZFactory = await ethers.getContractFactory('WXTZ');
  const WXTZ = WXTZFactory.attach(WXTZDeployed[networkName]);

  // Set enforced options
  let extraOptions;
  if (targetNetworkName == "etherlinkTestnet" || targetNetworkName == "etherlink") {
    // If etherlink, use a lot of gas
    const option = Options.newOptions().addExecutorLzReceiveOption(ethers.utils.formatUnits(41000000, "wei"), 0);
    extraOptions = option.toHex();
  } else {
    // If classic EVM, use 200000 wei (recommended by documentation)
    extraOptions = "0x00030100110100000000000000000000000000030d40";
  }

  let enforcedOptions = [
    {
      eid: endpointIds[targetNetworkName], // destination Endpoint ID
      msgType: 1,
      options: extraOptions,
    },
  ];

  // Send tokens
  const tx = await WXTZ.setEnforcedOptions(enforcedOptions);
  await tx.wait();
  console.log(`Enforced option from ${networkName} to ${targetNetworkName} is set to ${await WXTZ.enforcedOptions(endpointIds[targetNetworkName], 1)}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});