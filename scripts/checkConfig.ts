import * as ethers from 'ethers';

// Define provider
const provider = new ethers.providers.JsonRpcProvider('https://node.ghostnet.etherlink.com');

// Define the smart contract address and ABI
const etherlinkLzEndpointAddress = '0xec28645346D781674B4272706D8a938dB2BAA2C6';
const etherlinkLzEndpointABI = [
  'function getConfig(address _oapp, address _lib, uint32 _eid, uint32 _configType) external view returns (bytes memory config)',
];

// Create a contract instance
const contract = new ethers.Contract(etherlinkLzEndpointAddress, etherlinkLzEndpointABI, provider);

// Define the addresses and parameters
const oappAddress = '0xBCcC3c5963aB38D5Ab58f4441f73054C314a0FD9';
const sendLibAddress = '0xE62d066e71fcA410eD48ad2f2A5A860443C04035';
const receiveLibAddress = '0x2072a32Df77bAE5713853d666f26bA5e47E54717';
const remoteEid = 40102; // Example target endpoint ID, Binance Smart Chain
const executorConfigType = 1; // 1 for executor
const ulnConfigType = 2; // 2 for UlnConfig

async function getConfigAndDecode() {
  try {
    // Fetch and decode for sendLib (both Executor and ULN Config)
    const sendExecutorConfigBytes = await contract.getConfig(
      oappAddress,
      sendLibAddress,
      remoteEid,
      executorConfigType,
    );
    const executorConfigAbi = ['tuple(uint32 maxMessageSize, address executorAddress)'];
    const executorConfigArray = ethers.utils.defaultAbiCoder.decode(
      executorConfigAbi,
      sendExecutorConfigBytes,
    );
    console.log('Send Library Executor Config:', executorConfigArray);

    const sendUlnConfigBytes = await contract.getConfig(
      oappAddress,
      sendLibAddress,
      remoteEid,
      ulnConfigType,
    );
    const ulnConfigStructType = [
      'tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)',
    ];
    const sendUlnConfigArray = ethers.utils.defaultAbiCoder.decode(
      ulnConfigStructType,
      sendUlnConfigBytes,
    );
    console.log('Send Library ULN Config:', sendUlnConfigArray);

    // Fetch and decode for receiveLib (only ULN Config)
    const receiveUlnConfigBytes = await contract.getConfig(
      oappAddress,
      receiveLibAddress,
      remoteEid,
      ulnConfigType,
    );
    const receiveUlnConfigArray = ethers.utils.defaultAbiCoder.decode(
      ulnConfigStructType,
      receiveUlnConfigBytes,
    );
    console.log('Receive Library ULN Config:', receiveUlnConfigArray);
  } catch (error) {
    console.error('Error fetching or decoding config:', error);
  }
}

// Execute the function
getConfigAndDecode();


