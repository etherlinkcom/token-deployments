import { providers, Contract, utils, Wallet, ethers } from 'ethers';
import dotenv from 'dotenv'
import { network } from 'hardhat';
import LzEndpointV2ABI from '../abi/endpointV2.json';
import etherlinkTokens from '../deployments/etherlink.json';
import mainnetTokens from '../deployments/mainnet.json';
import arbitrumOneTokens from '../deployments/arbitrumOne.json';
import baseTokens from '../deployments/base.json';
import bscTokens from '../deployments/bsc.json';
dotenv.config()

// Supported networks
const SUPPORTED_NETWORKS = ['mainnet', 'arbitrumOne', 'bsc', 'base'];

// Define the addresses and parameters
const addresses: { [key: string]: { oappAddress: string } } = {
  mainnet: {
    oappAddress: mainnetTokens.WXTZ,
  },
  arbitrumOne: {
    oappAddress: arbitrumOneTokens.WXTZ,
  },
  bsc: {
    oappAddress: bscTokens.WXTZ,
  },
  base: {
    oappAddress: baseTokens.WXTZ,
  },
  etherlink: {
    oappAddress: etherlinkTokens.WXTZ,
  }
}

// Providers for each network
const providerList: { [key: string]: providers.JsonRpcProvider } = {
  mainnet: new providers.JsonRpcProvider('https://eth-pokt.nodies.app'),
  arbitrumOne: new providers.JsonRpcProvider('https://arbitrum.drpc.org'),
  bsc: new providers.JsonRpcProvider('https://bsc.drpc.org'),
  base: new providers.JsonRpcProvider('https://mainnet.base.org'),
  etherlink: new providers.JsonRpcProvider('https://node.mainnet.etherlink.com'),
};

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
}``

/**
 * This function create the transactions to set the default lib config. Source chain represente the source in the pathway
 * and destination chain the destination.
 * @param srcChain The name of the source chain
 * @param dstChain The name of the destination chain
 * @returns A promise of the data of the transactions to be executed
 */
async function setLibraryConfig(srcChain: string, dstChain: string) {
  // Get metadata from url
  const response = await fetch(METADATA_URL);
  const metadata = await response.json();
  // Get endpoint for src id
  const lzDeployment = getEndpointIdDeployment(endpointIds[srcChain], metadata);

  // Get address and libraries from endpoint
  const endpointAddress = lzDeployment.endpointV2.address;

  // Create contract for endpoint
  const provider = providerList[srcChain];
  const endpointContract = new ethers.Contract(endpointAddress, LzEndpointV2ABI, provider);

  // Try to retrieve the lib from endpoint contract, undefined take the one in the metadata file
  const sendLibraryAddress = (await endpointContract.getSendLibrary(addresses[srcChain].oappAddress, endpointIds[dstChain])).lib || lzDeployment.sendUln302.address;
  const receiveLibraryAddress = (await endpointContract.getReceiveLibrary(addresses[srcChain].oappAddress, endpointIds[dstChain])).lib || lzDeployment.receiveUln302.address;

  // Send

  // Retrieve default send Uln config
  const sendUlnConfig = await endpointContract.getConfig(
    addresses[srcChain].oappAddress,
    sendLibraryAddress,
    endpointIds[dstChain],
    2,
  );

  const setSendConfigParamUln = {
    eid: endpointIds[dstChain],
    configType: 2, // CONFIG_TYPE_ULN
    config: sendUlnConfig// ulnSendConfigEncoded,
  };

  // Receive

  // Retrieve default receive Uln config
  const receiveUlnConfig = await endpointContract.getConfig(
    addresses[srcChain].oappAddress,
    receiveLibraryAddress,
    endpointIds[dstChain],
    2,
  );

  const setReceiveConfigParamUln = {
    eid: endpointIds[dstChain],
    configType: 2, // CONFIG_TYPE_ULN
    config: receiveUlnConfig// ulnReceiveConfigEncoded,
  };

  // Executor (on send)

  // Retrieve default executor config
  const configExecutor = await endpointContract.getConfig(
    addresses[srcChain].oappAddress,
    sendLibraryAddress,
    endpointIds[dstChain],
    1,
  );

  const setConfigParamExecutor = {
    eid: endpointIds[dstChain],
    configType: 1, // CONFIG_TYPE_EXECUTOR
    config: configExecutor//executorConfigEncoded,
  };

  console.log("Executor config:", setConfigParamExecutor);

  console.log("Send uln config:", setSendConfigParamUln);

  console.log("Receive uln config:", setReceiveConfigParamUln);

  // Return transaction for endpoint contract
  return [
    endpointContract.populateTransaction.setConfig(addresses[srcChain].oappAddress, sendLibraryAddress, [setSendConfigParamUln, setConfigParamExecutor]),
    endpointContract.populateTransaction.setConfig(addresses[srcChain].oappAddress, receiveLibraryAddress, [setReceiveConfigParamUln]),
  ];
}

/**
 * This function create the transactions to set the DEFAULT send and receive libraries. Source chain represente the source in the pathway
 * and destination chain the destination.
 * @param srcChain The name of the source chain
 * @param dstChain The name of the destination chain
 * @returns A promise of the data of the transactions to be executed
 */
async function setLibrary(srcChain: string, dstChain: string) {
    // Get metadata from url
    const response = await fetch(METADATA_URL);
    const metadata = await response.json();
    // Get endpoint for src id
    const lzDeployment = getEndpointIdDeployment(endpointIds[srcChain], metadata);
  
    // Get address and libraries from endpoint
    const endpointAddress = lzDeployment.endpointV2.address;
  
    // Create contract for endpoint
    const provider = providerList[srcChain];
    const endpointContract = new ethers.Contract(endpointAddress, LzEndpointV2ABI, provider);
  
    // Try to retrieve the lib from endpoint contract, undefined take the one in the metadata file
    const sendLibraryAddress = await endpointContract.defaultSendLibrary(endpointIds[dstChain]) || lzDeployment.sendUln302.address;
    const receiveLibraryAddress = await endpointContract.defaultReceiveLibrary(endpointIds[dstChain]) || lzDeployment.receiveUln302.address;

    console.log("Default sendLibraryAddress:", sendLibraryAddress);
    console.log("Default receiveLibraryAddress:", receiveLibraryAddress);

    return [
      endpointContract.populateTransaction.setSendLibrary(addresses[srcChain].oappAddress, endpointIds[dstChain], sendLibraryAddress),
      endpointContract.populateTransaction.setReceiveLibrary(addresses[srcChain].oappAddress, endpointIds[dstChain], receiveLibraryAddress, 0)
    ]
}

async function executeTransactions(transactions: any[], chain: string, privateKey: string) {
  const provider = providerList[chain];
  const signer = new Wallet(privateKey, provider);

  for (const tx of transactions) {
    try {
      console.log('Gas estimation: ', await provider.estimateGas({ ...await tx, from: await signer.getAddress() }));

      // Send the transaction
      const transaction = await signer.sendTransaction(await tx);
      console.log(`Transaction sent: ${transaction.hash}`);
      await transaction.wait();
      console.log(`Transaction confirmed: ${transaction.hash}`);
    } catch (error: any) {
      const errorData = error?.error?.error?.error?.data || error?.error?.error?.data;
      console.log({ errorData });
      if (errorData) {
        const res = await fetch(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${errorData}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        });

        if (res.status === 200) {
          const json: any = await res.json();
          const errorMessage = json.results?.[0]?.text_signature;

          if (errorMessage) {
            throw new Error(errorMessage);
          }
        }
      }

      throw error;
    }
  }
}

async function executeSourceTransactions(privateKey: string, srcChain: string, dstChain: string) {
  console.log(`Setting from ${srcChain} to ${dstChain}:\n`);

  // Libs
  console.log("Enforcing receive and send libraries...");
  let sourceChainTransactions = await setLibrary(srcChain, dstChain);
  await executeTransactions(sourceChainTransactions, srcChain, privateKey);
  console.log();

  // Config (Uln and Executor)
  console.log("Enforcing configuration on the send and receive libraries...");
  sourceChainTransactions = await setLibraryConfig(srcChain, dstChain);
  await executeTransactions(sourceChainTransactions, srcChain, privateKey);
  console.log();
}

async function executeDestinationTransactions(privateKey: string, srcChain: string, dstChain: string) {
  console.log(`Setting from ${dstChain} to ${srcChain}:\n`);

  // Libs
  console.log("Enforcing receive and send libraries...");
  let destinationChainTransactions = await setLibrary(dstChain, srcChain);
  await executeTransactions(destinationChainTransactions, dstChain, privateKey);
  console.log();

  console.log("Enforce configuration on the send and receive libraries...");
  destinationChainTransactions = await setLibraryConfig(dstChain, srcChain);
  await executeTransactions(destinationChainTransactions, dstChain, privateKey);
  console.log();
}

async function main() {
  // Get the src & dst chains
  const dstChain = process.env.targetNetworkName || "";
  const srcChain = network.name;
  if (!SUPPORTED_NETWORKS.includes(dstChain) || !SUPPORTED_NETWORKS.includes(srcChain)) {
    console.error("Unsupported chain provided, the chains supported are:", SUPPORTED_NETWORKS.join(', '));
    throw new Error('Unsupported chain');
  }
  console.log(`Enforcing default libs, default config for WXTZ on the pathway ${srcChain} to ${dstChain}\n`);

  try {
    // Execute source transactions
    await executeSourceTransactions(process.env.PRIVATE_KEY as string, srcChain, dstChain);

    // Execute destination transactions
    await executeDestinationTransactions(process.env.PRIVATE_KEY as string, srcChain, dstChain);

    console.log('All transactions completed successfully');
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

// Execute the function
main()
  .then(() => {
    // console.log("Script completed successfully.");
  })
  .catch((error) => {
    console.error("Error occurred:", error);
  });