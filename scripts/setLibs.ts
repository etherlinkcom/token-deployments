import { providers, Contract, utils, Wallet, } from 'ethers';
import { network, ethers } from 'hardhat';
import etherlinkTokens from '../deployments/etherlink.json';
import mainnetTokens from '../deployments/mainnet.json';
import arbitrumOneTokens from '../deployments/arbitrumOne.json';
import baseTokens from '../deployments/base.json';
import bscTokens from '../deployments/bsc.json';

// Supported networks
const SUPPORTED_NETWORKS = ['mainnet', 'arbitrumOne', 'bsc', 'base', 'etherlink'];

// Contract ABI
const LzEndpointABI = [
  'function setSendLibrary(address oapp, uint32 eid, address sendLib) external',
  'function setReceiveLibrary(address oapp, uint32 eid, address receiveLib, uint256 gracePeriod) external',
];

// Define the addresses and parameters
const addresses: { [key: string]: { oappAddress: string, sendLibAddress: string, receiveLibAddress: string } } = {
  mainnet: {
    oappAddress: mainnetTokens.WXTZ,
    sendLibAddress: '0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1',
    receiveLibAddress: '0xc02Ab410f0734EFa3F14628780e6e695156024C2'
  },
  arbitrumOne: {
    oappAddress: arbitrumOneTokens.WXTZ,
    sendLibAddress: '0x975bcD720be66659e3EB3C0e4F1866a3020E493A',
    receiveLibAddress: '0x7B9E184e07a6EE1aC23eAe0fe8D6Be2f663f05e6'
  },
  bsc: {
    oappAddress: bscTokens.WXTZ,
    sendLibAddress: '0x9F8C645f2D0b2159767Bd6E0839DE4BE49e823DE',
    receiveLibAddress: '0xB217266c3A98C8B2709Ee26836C98cf12f6cCEC1'
  },
  base: {
    oappAddress: baseTokens.WXTZ,
    sendLibAddress: '0xB5320B0B3a13cC860893E2Bd79FCd7e13484Dda2',
    receiveLibAddress: '0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf'
  },
  etherlink: {
    oappAddress: etherlinkTokens.WXTZ,
    sendLibAddress: '0xc1B621b18187F74c8F6D52a6F709Dd2780C09821',
    receiveLibAddress: '0x377530cdA84DFb2673bF4d145DCF0C4D7fdcB5b6'
  }
}

// LayerZero endpoints ids
const endpointIds: { [key: string]: number } = {
  mainnet: 30101,
  arbitrumOne: 30110,
  bsc: 30102,
  base: 30184,
  etherlink: 30292,
}

const METADATA_URL = 'https://metadata.layerzero-api.com/v1/metadata';

function getEndpointIdDeployment(eid: number, metadata: any) {
  const srcEidString = eid.toString();
  for (const objectKey in metadata) {
    const entry = metadata[objectKey];

    if (typeof entry.deployments !== 'undefined') {
      for (const deployment of entry.deployments) {
        if (srcEidString === deployment.eid) {
          return deployment;
        }
      }
    }
  }

  throw new Error(`Can't find endpoint with eid: "${eid}",`);
}

async function setLibs() {
  // Get the src & dst chains
  const dstChain = process.env.targetNetworkName || "";
  const srcChain = network.name;
  if (!SUPPORTED_NETWORKS.includes(dstChain) || !SUPPORTED_NETWORKS.includes(srcChain)) {
    console.error("Unsupported chain provided, the chains supported are:", SUPPORTED_NETWORKS.join(', '));
    throw new Error('Unsupported chain');
  }
  console.log(`WXTZ set receive and send libs on ${srcChain} targeting ${dstChain}:`);
  // Get metadata from url
  const response = await fetch(METADATA_URL);
  const metadata = await response.json();
  // Get endpoint for src id
  const lzDeployment = getEndpointIdDeployment(endpointIds[srcChain], metadata);
  // Get address and libraries from endpoint
  const endpointAddress = lzDeployment.endpointV2.address;
  const sendUln302Address = lzDeployment.sendUln302.address;
  const receiveUln302Address = lzDeployment.receiveUln302.address;
  const [signer] = await ethers.getSigners();
  const contract = new ethers.Contract(endpointAddress, LzEndpointABI, signer);
  const WXTZDeployed: { [key: string]: string } = {
    etherlink: etherlinkTokens.WXTZ,
    mainnet: mainnetTokens.WXTZ,
    arbitrumOne: arbitrumOneTokens.WXTZ,
    base: baseTokens.WXTZ,
    bsc: bscTokens.WXTZ
  };

  try {
    // Set receive and send libs
    console.log(`Setting sendUln302 lib ${sendUln302Address} on wxtz ${WXTZDeployed[srcChain]} with dstEid ${endpointIds[dstChain]}...`);
    const sendLibTx = await contract.setSendLibrary(WXTZDeployed[srcChain], endpointIds[dstChain], sendUln302Address);
    await sendLibTx.wait();
    console.log("sendUln302 lib set.")
    console.log(`Setting receiveUln302 lib ${receiveUln302Address} on wxtz ${WXTZDeployed[srcChain]} with dstEid ${endpointIds[dstChain]}...`);
    const receiveLibTx = await contract.setReceiveLibrary(WXTZDeployed[srcChain], endpointIds[dstChain], receiveUln302Address, 0);
    await receiveLibTx.wait();
    console.log("receiveUln302 lib set.\n")
  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}

// Execute the function
setLibs()
  .then(() => {
    console.log("Script completed successfully.");
  })
  .catch((error) => {
    console.error("Error occurred:", error);
  });