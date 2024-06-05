import { ethers, network } from 'hardhat';
import etherlinkTestnetTokens from '../deployments/etherlinkTestnet.json';
import sepoliaTokens from '../deployments/sepolia.json';
import bscTestnetTokens from '../deployments/bscTestnet.json';
import { customFormatBytes32String } from './utils';
import { error } from 'console';
import { Options } from '@layerzerolabs/lz-v2-utilities';

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
  const [owner] = await ethers.getSigners();
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

  // If this is Etherlink deposit token
  if (networkName == 'etherlinkTestnet') {
    console.log('Deposit 1 XTZ in the WXTZ...');
    await WXTZ.deposit({ value: ethers.utils.parseEther('1') });
    console.log('WXTZ received.');
  }

  // Calculate options
  let extraOptions;
  if (targetNetworkName == "etherlinkTestnet") {
    // If etherlink, use a lot of gas
    const option = Options.newOptions().addExecutorLzReceiveOption(ethers.utils.formatUnits(41000000, "wei"), 0);
    extraOptions = option.toHex();
  } else {
    // If classic EVM, use 200000 wei (recommended by documentation)
    extraOptions = "0x00030100110100000000000000000000000000030d40";
  }

  // Estimate gas
  const sendParam = {
    dstEid: endpointIds[targetNetworkName], // Destination endpoint ID.
    to: customFormatBytes32String(owner.address), // Recipient address.
    amountLD: ethers.utils.parseEther("1"), // Amount to send in local decimals.
    minAmountLD: 0, // Minimum amount to send in local decimals.
    extraOptions: extraOptions, // Additional options supplied by the caller to be used in the LayerZero message.
    composeMsg: "0x", // The composed message for the send() operation.
    oftCmd: "0x", // The OFT command to be executed, unused in default OFT implementations.
  };
  const estimatedGas = await WXTZ.quoteSend(
    sendParam,
    false // do we want to pay in lz token
  );

  console.log(`Your send is estimated at ${estimatedGas.nativeFee} gas amount in native gas token and ${estimatedGas.lzTokenFee} gas amount in ZRO token.`);

  console.log(`Sending the tokens from ${networkName} to ${targetNetworkName}...`);

  // Send tokens
  const tx = await WXTZ.send(
    sendParam,
    estimatedGas, // messaging fee
    owner.address, // refund address
    { value: estimatedGas.nativeFee }
  );

  console.log(`See the token transfer here: https://testnet.layerzeroscan.com/tx/${tx.hash}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});