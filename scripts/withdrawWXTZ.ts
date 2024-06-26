import { ethers, network } from 'hardhat';
import etherlinkTestnetTokens from '../deployments/etherlinkTestnet.json';
import etherlinkTokens from '../deployments/etherlink.json';

// Note: you can only deposit and withdraw on Etherlink
async function main() {
  const [ owner ] = await ethers.getSigners();
  // current network
  const networkName = network.name;
  const WXTZDeployed: { [key: string]: string } = {
    etherlinkTestnet: etherlinkTestnetTokens.WXTZ,
    etherlink: etherlinkTokens.WXTZ,
  };
  const WXTZFactory = await ethers.getContractFactory('WXTZ');
  const WXTZ = WXTZFactory.attach(WXTZDeployed[networkName]);

  console.log(`Your balance before withdraw: ${await WXTZ.balanceOf(owner.address)}.`);
  const tx = await WXTZ.withdraw(await WXTZ.balanceOf(owner.address));
  await tx.wait();
  console.log(`Your balance after withdraw: ${await WXTZ.balanceOf(owner.address)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});