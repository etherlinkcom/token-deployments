import { providers, ethers } from 'ethers';

// Contract ABI
const ABILzGetConfig = [
  'function getConfig(uint32 _eid, address _oapp, uint32 _configType) external view returns (bytes memory config)',
];

const ABILzIsDefaultSendLibrary = [
  'function isDefaultSendLibrary(address _sender, uint32 _dstEid) external view returns (bool)',
];

const ABILzGetReceiveLibrary = [
  'function getReceiveLibrary(address _receiver, uint32 _srcEid) external view returns (address lib, bool isDefault)',
];

const ABILzDelegate = [
  'function delegates(address oapp) external view returns (address delegate)',
];

const ABILzGetSendLibrary = [
  'function getSendLibrary(address _sender, uint32 _dstEid) external view returns (address lib)',
];

const ABIOappEndPoint = [
  'function endpoint() view returns (address)',
];

const ABIOappPeers = [
  'function peers(uint32 eid) view returns (bytes32 peer)',
];

const ABIOappEnforcedOptions = [
  'function enforcedOptions(uint32 eid, uint16 msgType) view returns (bytes enforcedOption)',
];

const ABILibGetAppUlnConfig = [
  {
    "inputs": [
      {
        "name": "_oapp",
        "type": "address"
      },
      {
        "name": "_remoteEid",
        "type": "uint32"
      }
    ],
    "name": "getAppUlnConfig",
    "outputs": [
      {
        "components": [
          {
            "name": "confirmations",
            "type": "uint64"
          },
          {
            "name": "requiredDVNCount",
            "type": "uint8"
          },
          {
            "name": "optionalDVNCount",
            "type": "uint8"
          },
          {
            "name": "optionalDVNThreshold",
            "type": "uint8"
          },
          {
            "name": "requiredDVNs",
            "type": "address[]"
          },
          {
            "name": "optionalDVNs",
            "type": "address[]"
          }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const ABILibGetExecutorConfig = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_oapp",
        "type": "address"
      },
      {
        "internalType": "uint32",
        "name": "_remoteEid",
        "type": "uint32"
      }
    ],
    "name": "getExecutorConfig",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint32",
            "name": "maxMessageSize",
            "type": "uint32"
          },
          {
            "internalType": "address",
            "name": "executor",
            "type": "address"
          }
        ],
        "internalType": "struct ExecutorConfig",
        "name": "rtnConfig",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const ABIOwner = [
  'function owner() view returns (address)',
];

// Providers for each network
const providerList: { [key: string]: providers.JsonRpcProvider } = {
  mainnet: new providers.JsonRpcProvider('https://eth-pokt.nodies.app'),
  arbitrumOne: new providers.JsonRpcProvider('https://arbitrum.drpc.org'),
  bsc: new providers.JsonRpcProvider('https://bsc.drpc.org'),
  base: new providers.JsonRpcProvider('https://mainnet.base.org'),
  etherlink: new providers.JsonRpcProvider('https://node.mainnet.etherlink.com'),
};

// Define the addresses and parameters
const addresses: { [key: string]: { oappAddress: string } } = {
  etherlink: {
    oappAddress: '0xc9b53ab2679f573e480d01e0f49e2b5cfb7a3eab'
  },
  mainnet: {
    oappAddress: '0xc9b53ab2679f573e480d01e0f49e2b5cfb7a3eab'
  },
  arbitrumOne: {
    oappAddress: '0x7424f00845777A06E21F0bd8873f814A8A814B2D'
  },
  bsc: {
    oappAddress: '0x91F9cc2649ac70a071602cadE9b0C1A5868af51D'
  },
  base: {
    oappAddress: '0x91F9cc2649ac70a071602cadE9b0C1A5868af51D'
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

const executorConfigType = 1; // 1 for executor
const ulnConfigType = 2; // 2 for UlnConfig

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

async function analyzeOApp() {

  // Rotate through each chain

  for (const chain in addresses) {
    console.log('*******************************************************************************');
    console.log(`Configuration on ${chain} (${endpointIds[chain]})`);
    console.log('*******************************************************************************\n');

    console.log("OFT address:", addresses[chain].oappAddress);

    // Get the owner of the OApp
    await getOappOwner(chain);

    // Extract the LZ endpoint from the OApp &
    // check whether the LZ endpoint is the official one.
    await checkOappEndpoint(chain);

    // Get the registered delegate for the OApp at the LZ endpoint
    await getDelegate(chain);

    for (const remote_chain in addresses) {
      if (remote_chain != chain) {
        console.log('******************************************');
        console.log(`Remote chain: ${remote_chain} (${endpointIds[remote_chain]})`);
        console.log('******************************************\n');

        // Get configured peer and check whether peer is the correct one
        await getCheckPeer(chain, remote_chain);

        console.log(`Analyse SEND library:`);
        // Get configured SEND library
        const sendLib = await getSendLibrary(chain, remote_chain)
        // Check whether used SEND library is the configured default one:
        await isDefaultSendLibrary(chain, remote_chain)

        if (sendLib) {
          await getAppUlnConfigInLib(chain, remote_chain, sendLib); // will show 0 if not set
          await getConfig(chain, remote_chain, sendLib);
          await getExecutorConfigInLib(chain, remote_chain, sendLib);
        }
        console.log(`Analyse SEND library finished.\n`);

        console.log(`Analyse RECEIVE library:`);
        // Get configured RECEIVE library &
        // Check whether used RECEIVE library is the configured default one:
        const receiveLib = await getReceiveLibrary(chain, remote_chain)
        if (receiveLib) {
          await getAppUlnConfigInLib(chain, remote_chain, receiveLib); // will show 0 if not set
          await getConfig(chain, remote_chain, receiveLib);
        }
        console.log(`Analyse RECEIVE library finished.\n`);

        // Enforced Options
        await enforcedOptionsOnOapp(chain, remote_chain);
      }
    }
    // break; // remove
  }
}

async function getOappOwner(chain: string) {
  const oappAddress = addresses[chain].oappAddress;
  const provider = providerList[chain];

  try {
    const owner = await callContractMethod(
      oappAddress,
      ABIOwner,
      provider,
      'owner');
    console.log(`Configured owner for OApp is: ${owner}\n`);
  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}


async function getCheckPeer(chain: string, remote_chain: string) {
  const oappAddress = addresses[chain].oappAddress;
  const provider = providerList[chain];

  try {
    const peer = await callContractMethod(
      oappAddress,
      ABIOappPeers,
      provider,
      'peers',
      endpointIds[remote_chain]
    );
    console.log(`Configured peer in OApp is: ${peer}\n`);

    const peer_hex = ethers.utils.getAddress("0x" + peer.slice(26));

    if (peer_hex === ethers.utils.getAddress(addresses[remote_chain].oappAddress)) {
      console.log(`Ok. Peer address is the correct one.\n`);
    } else {
      console.log(`Not ok. Peer address should be the OApp address ${addresses[remote_chain].oappAddress}\n`);
    }

  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}

async function getDelegate(chain: string) {
  const response = await fetch(METADATA_URL);
  const metadata = await response.json();

  const lzDeployment = getEndpointIdDeployment(endpointIds[chain], metadata);
  const endpointAddress = lzDeployment.endpointV2.address;
  const provider = providerList[chain];

  try {
    const delegate = await callContractMethod(
      endpointAddress,
      ABILzDelegate,
      provider,
      'delegates',
      addresses[chain].oappAddress
    );
    console.log(`Registered delegate in endpoint for OApp is: ${delegate}\n`);
  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}

async function checkOappEndpoint(chain: string) {
  try {
    // Get the metadata and deployment information for the specified chain
    const response = await fetch(METADATA_URL);
    const metadata = await response.json();

    const oappAddress = addresses[chain].oappAddress;
    const provider = providerList[chain];

    // Call the `endpoint` method of the Oapp contract
    const endpoint = await callContractMethod(
      oappAddress,
      ABIOappEndPoint,
      provider,
      'endpoint'
    );

    console.log(`Configured endpoint address for OApp is: ${endpoint}`);

    // Fetch the official endpoint address from metadata for verification
    const lzDeployment = getEndpointIdDeployment(endpointIds[chain], metadata);
    const officialEndpointAddress = lzDeployment.endpointV2.address;

    if (areAddressesEqual(officialEndpointAddress, endpoint)) {
      console.log("Ok, the configured OApp address is the official one.\n");
    } else {
      console.log(`Not ok, the configured OApp address is NOT the official one (${officialEndpointAddress})\n.`);
    }

  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}

async function getSendLibrary(chain: string, remote_chain: string): Promise<string | undefined> {
  const response = await fetch(METADATA_URL);
  const metadata = await response.json();

  const lzDeployment = getEndpointIdDeployment(endpointIds[chain], metadata);
  const endpointAddress = lzDeployment.endpointV2.address;
  const provider = providerList[chain];

  try {
    const sendLib = await callContractMethod(
      endpointAddress,
      ABILzGetSendLibrary,
      provider,
      'getSendLibrary',
      addresses[chain].oappAddress,
      endpointIds[remote_chain]
    );
    console.log(`Configured send library is: ${sendLib}`);
    return sendLib
  } catch (error) {
    console.error('Error fetching or decoding config:', error);
    return undefined;
  }
}

async function isDefaultSendLibrary(chain: string, remote_chain: string) {
  const response = await fetch(METADATA_URL);
  const metadata = await response.json();
  // Get endpoint for src id
  const lzDeployment = getEndpointIdDeployment(endpointIds[chain], metadata);
  // Get address and libraries from endpoint
  const endpointAddress = lzDeployment.endpointV2.address;
  const provider = providerList[chain];

  try {
    const isDefaultSendLibrary = await callContractMethod(
      endpointAddress,
      ABILzIsDefaultSendLibrary,
      provider,
      'isDefaultSendLibrary',
      addresses[chain].oappAddress,
      endpointIds[remote_chain]
    );
    console.log("Is default send library used?", isDefaultSendLibrary);
  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}

async function getReceiveLibrary(chain: string, remote_chain: string): Promise<string | undefined> {
  const response = await fetch(METADATA_URL);
  const metadata = await response.json();

  // Get endpoint for dst id
  const lzDeployment = getEndpointIdDeployment(endpointIds[chain], metadata);
  const endpointAddress = lzDeployment.endpointV2.address;
  const provider = providerList[chain];

  try {
    const receiveLibrary = await callContractMethod(
      endpointAddress,
      ABILzGetReceiveLibrary,
      provider,
      'getReceiveLibrary',
      addresses[chain].oappAddress,
      endpointIds[remote_chain]
    );

    console.log(`Configured receive library is: ${receiveLibrary.lib}`);
    console.log("Is default receive library used?", receiveLibrary.isDefault);
    return receiveLibrary.lib
  } catch (error) {
    console.error('Error fetching or decoding config:', error);
    return undefined;
  }
}


// Returns the OApp's config for the library. If there is no config the default config is used.
async function getAppUlnConfigInLib(chain: string, remote_chain: string, library: string) {
  const provider = providerList[chain];

  try {
    const config = await callContractMethod(
      library,
      ABILibGetAppUlnConfig,
      provider,
      'getAppUlnConfig',
      addresses[chain].oappAddress,
      endpointIds[remote_chain]
    );
    console.log("OApp specific library configuration (Security Stack):");
    console.log("- Confirmations:", parseInt(config.confirmations));
    console.log("- Required DVN Count:", config.requiredDVNCount);
    console.log("- Optional DVN Count:", config.optionalDVNCount);
    console.log("- Optional DVN Threshold:", config.optionalDVNThreshold);
    console.log("- Required DVNs:", config.requiredDVNs);
    console.log("- Optional DVNs:", config.optionalDVNs);
  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}

// Returns the OApp's executor config for the send library. If there is no config the default config is used.
async function getExecutorConfigInLib(chain: string, remote_chain: string, sendLibrary: string) {
  const provider = providerList[chain];

  try {
    const config = await callContractMethod(
      sendLibrary,
      ABILibGetExecutorConfig,
      provider,
      'getExecutorConfig',
      addresses[chain].oappAddress,
      endpointIds[remote_chain]
    );
    console.log("OApp specific send library configuration (Executor):");
    console.log("- Max message size:", parseInt(config.maxMessageSize));
    console.log("- Executor address:", config.executor);
  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}

async function getConfig(chain: string, remote_chain: string, library: string) {
  const provider = providerList[chain];

  try {
    const config = await callContractMethod(
      library,
      ABILzGetConfig,
      provider,
      'getConfig',
      endpointIds[remote_chain],
      addresses[chain].oappAddress,
      ulnConfigType
    );
    const ulnConfigStructType = [
      'tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)',
    ];
    const receiveUlnConfigArray = ethers.utils.defaultAbiCoder.decode(
      ulnConfigStructType,
      config,
    );
    console.log(`OApp library configuration:`);
    console.log(`- Confirmations: ${parseInt(receiveUlnConfigArray[0][0])} (${receiveUlnConfigArray[0][0]._hex})`);
    console.log('- Required DVN Count:', receiveUlnConfigArray[0][1]);
    console.log('- Optional DVN Count:', receiveUlnConfigArray[0][2]);
    console.log('- Optional DVN Threshold:', receiveUlnConfigArray[0][3]);
    console.log('- Required DVNs:', receiveUlnConfigArray[0][4]);
    console.log('- Optional DVNs:', receiveUlnConfigArray[0][5], '\n');

  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}

async function enforcedOptionsOnOapp(chain: string, remote_chain: string) {
  const provider = providerList[chain];

  try {
    const enforcedOption = await callContractMethod(
      addresses[chain].oappAddress,
      ABIOappEnforcedOptions,
      provider,
      'enforcedOptions',
      endpointIds[remote_chain],
      1
    );
    console.log(`Enforced option from ${chain} to ${remote_chain} is set to ${enforcedOption}\n`);
  } catch (error) {
    console.error('Error fetching enforced option:', error);
  }
}

// ***********************
// Helper functions
// ***********************

async function callContractMethod(
  contractAddress: string,
  abi: any,
  provider: ethers.providers.Provider,
  methodName: string,
  ...args: any[]
) {
  const contract = new ethers.Contract(contractAddress, abi, provider);
  try {
    const result = await contract[methodName](...args);
    return result;
  } catch (error) {
    console.error(`Error calling ${methodName}:`, error);
    throw error;
  }
}

function areAddressesEqual(address1: string, address2: string): boolean {
  try {
    // Normalize addresses to their checksummed versions and compare
    return ethers.utils.getAddress(address1) === ethers.utils.getAddress(address2);
  } catch (error) {
    console.error("Invalid address provided:", error);
    return false; // Return false if either address is invalid
  }
}


// ***********************
// Execute the function
// ***********************

analyzeOApp()
  .then(() => {
    console.log("Script completed successfully.");
  })
  .catch((error) => {
    console.error("Error occurred:", error);
  });