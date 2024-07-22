const ethers = require("ethers")


// Fork mainnet
// Impersonate Camille wallet
const NethermindLZDVNEtherlink = "0x7a23612f07d81f16b26cf0b5a4c3eca0e8668df2"
const chainAddresses = {
    "ethereum": {
        "eid": 30101,
        "oapp": "0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb",
        "endpoint": "0x1a44076050125825900e736c501f859c50fE728c",
        "executor": "0x173272739Bd7Aa6e4e214714048a9fE699453059",
        "send1": "0xD231084BfB234C107D3eE2b22F97F3346fDAF705",
        "send2": "0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1",
        "receive1": "0x245B6e8FFE9ea5Fc301e32d16F66bD4C2123eEfC",
        "receive2": "0xc02Ab410f0734EFa3F14628780e6e695156024C2",
        "LZDVN": "0x589dEDbD617e0CBcB916A9223F4d1300c294236b",
        "NethermindDVN": "0xa59BA433ac34D2927232918Ef5B2eaAfcF130BA5"
    },
    "arbitrum": {
        "eid": 30110,
        "oapp": "0x7424f00845777A06E21F0bd8873f814A8A814B2D",
        "endpoint": "0x1a44076050125825900e736c501f859c50fE728c",
        "executor": "0x31CAe3B7fB82d847621859fb1585353c5720660D",
        "send1": "0x5cDc927876031B4Ef910735225c425A7Fc8efed9",
        "send2": "0x975bcD720be66659e3EB3C0e4F1866a3020E493A",
        "receive1": "0xe4DD168822767C4342e54e6241f0b91DE0d3c241",
        "receive2": "0x7B9E184e07a6EE1aC23eAe0fe8D6Be2f663f05e6",
        "LZDVN": "0x2f55C492897526677C5B68fb199ea31E2c126416",
        "NethermindDVN": "0xa7b5189bcA84Cd304D8553977c7C614329750d99"
    },
    "etherlink": {
        "eid": 30292,
        "oapp": "0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb",
        "endpoint": "0xAaB5A48CFC03Efa9cC34A2C1aAcCCB84b4b770e4",
        "executor": "0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e",
        "send1": "0x7cacBe439EaD55fa1c22790330b12835c6884a91",
        "send2": "0xc1B621b18187F74c8F6D52a6F709Dd2780C09821",
        "receive1": "0x282b3386571f7f794450d5789911a9804FA346b4",
        "receive2": "0x377530cdA84DFb2673bF4d145DCF0C4D7fdcB5b6",
        "LZDVN": "0xc097ab8CD7b053326DFe9fB3E3a31a0CCe3B526f",
        "NethermindDVN": "0x7a23612f07d81f16b26cf0b5a4c3eca0e8668df2"
    },
    "base": {
        "eid": 30184,
        "oapp": "0x91F9cc2649ac70a071602cadE9b0C1A5868af51D",
        "endpoint": "0x1a44076050125825900e736c501f859c50fE728c",
        "executor": "0x2CCA08ae69E0C44b18a57Ab2A87644234dAebaE4",
        "send1": "0x9DB3714048B5499Ec65F807787897D3b3Aa70072",
        "send2": "0xB5320B0B3a13cC860893E2Bd79FCd7e13484Dda2",
        "receive1": "0x58D53a2d6a08B72a15137F3381d21b90638bd753",
        "receive2": "0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf",
        "LZDVN": "0x9e059a54699a285714207b43B055483E78FAac25",
        "NethermindDVN": "0xcd37CA043f8479064e10635020c65FfC005d36f6"
    },
    "binanceChain": {
        "eid": 30102,
        "oapp": "0x91F9cc2649ac70a071602cadE9b0C1A5868af51D",
        "endpoint": "0x1a44076050125825900e736c501f859c50fE728c",
        "executor": "0x3ebD570ed38B1b3b4BC886999fcF507e9D584859",
        "send1": "0xfCCE712C9be5A78FE5f842008e0ed7af59455278",
        "send2": "0x9F8C645f2D0b2159767Bd6E0839DE4BE49e823DE",
        "receive1": "0xff3da3a1cd39Bbaeb8D7cB2deB83EfC065CBb38F",
        "receive2": "0xB217266c3A98C8B2709Ee26836C98cf12f6cCEC1",
        "LZDVN": "0xfD6865c841c2d64565562fCc7e05e619A30615f0",
        "NethermindDVN": "0x31F748a368a893Bdb5aBB67ec95F232507601A73"
    },

}



// Define provider
const provider = new ethers.providers.JsonRpcProvider('https://eth.meowrpc.com');

// Define the smart contract address and ABI
const ethereumLzEndpointAddress = chainAddresses["ethereum"]["endpoint"];
const ethereumLzEndpointABI = [
    'function getConfig(address _oapp, address _lib, uint32 _eid, uint32 _configType) external view returns (bytes memory config)',
];

// Create a contract instance
const contract = new ethers.Contract(ethereumLzEndpointAddress, ethereumLzEndpointABI, provider);

// Define the addresses and parameters
const oappAddress = chainAddresses["ethereum"]["oapp"];
const sendLibAddress = chainAddresses["ethereum"]["send2"];
const receiveLibAddress = chainAddresses["ethereum"]["receive2"]
const remoteEid = chainAddresses["etherlink"]["eid"]; // Example target endpoint ID, Binance Smart Chain
const executorConfigType = 1; // 1 for executor
const ulnConfigType = 2; // 2 for UlnConfig

async function getConfigAndDecode() {
    try {
        // Fetch and decode for sendLib (both Executor and ULN Config)
        // SENDING
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


        /// ULN Sending Configuration
        // SENDING
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
        // RECEIVING
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

/*
    We need something that will loop through all the other chains and etherlink
    Connect etherlink to the other chains
    Set DVNs to LZ and Nethermind

*/

// To use non-default protocol settings, the delegate (should always be OApp owner) should call setSendLibrary, setReceiveLibrary, and setConfig from the OApp's Endpoint.

// When setting your OApp's config, ensure that the Send Configuration for the OApp on the sending chain (Chain A) matches the Receive Configuration for the OApp on the receiving chain (Chain B).


// // Configure the sending OApp on Chain A
// const tx_send = await endpointContractChainA.setConfig(oappAddressA, sendLibAddressA, [
//     setConfigParamUln,
//     setConfigParamExecutor,
// ]);

// // Configure the receiving OApp on Chain B
// const tx_receive = await endpointContractChainB.setConfig(oappAddressB, receiveLibAddressB, [
//     setConfigParamUln,
// ]);

// // Ensure both transactions are confirmed before proceeding
// await tx_send.wait();
// await tx_receive.wait();


// Before changing any OApp Send or Receive configurations, you should first setSendLibrary and setReceiveLibrary to the intended library. At the time of writing, the latest library for Endpoint V2 is SendULN302.sol and ReceiveULN302.sol:

// const sendTx = await endpointContract.setSendLibrary(oappAddress, eid, sendLibAddress);
// await sendTx.wait();

// const receiveTx = await endpointContract.setReceiveLibrary(oappAddress, eid, receiveLibAddress);
// await receiveTx.wait();


