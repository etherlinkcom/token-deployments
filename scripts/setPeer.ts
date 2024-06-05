import { ethers, network } from 'hardhat';
import etherlinkTestnetTokens from '../deployments/etherlinkTestnet.json';
import sepoliaTokens from '../deployments/sepolia.json';
import bscTestnetTokens from '../deployments/bscTestnet.json';
import { customFormatBytes32String } from './utils';
import { error } from 'console';

const endpointIds: { [key: string]: string } = {
  sepolia: '40161',
  bscTestnet: '40102',
  avalancheFujiTestnet: '40106',
  polygonMumbai: '40109',
  arbitrumSepolia: '40231',
  optimismSepolia: '40232',
  etherlinkTestnet: '40239',
  mainnet: '30101',
  bsc: '30102',
  avalanche: '30106',
  polygon: '30109',
  arbitrumOne: '30110',
  optimisticEthereum: '30111',
};

async function main() {
  const [ owner ] = await ethers.getSigners();
  // current network
  const networkName = network.name;
  // targeted network
  const targetNetworkName = process.env.targetNetworkName || "";
  const WXTZDeployed: { [key: string]: string } = {
    etherlinkTestnet: etherlinkTestnetTokens.WXTZ,
    sepolia: sepoliaTokens.WXTZ,
    bscTestnet: bscTestnetTokens.WXTZ
  };
  const WXTZFactory = await ethers.getContractFactory('WXTZ');
  const WXTZ = WXTZFactory.attach(WXTZDeployed[networkName]);

  // set peer
  console.log(
    `Calling setPeer on your ${networkName} OFT for ${targetNetworkName} network.`
  );

  await WXTZ.setPeer(
    endpointIds[targetNetworkName],
    customFormatBytes32String(WXTZDeployed[targetNetworkName])
  );

  if (WXTZ.isPeer(endpointIds[targetNetworkName], customFormatBytes32String(WXTZDeployed[targetNetworkName]))) {
    console.log(
      `Your OFT on ${targetNetworkName} has been set as a peer on the ${networkName} OFT.`
    );
  } else {
    throw error(`Failed to set your OFT on ${targetNetworkName} as a peer on the ${networkName} OFT.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});