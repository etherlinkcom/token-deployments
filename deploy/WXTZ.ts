import assert from 'assert'
import { type DeployFunction } from 'hardhat-deploy/types'
import { updateDeploymentFile } from '../scripts/utils'
import { testnetChains, mainnetChains } from '../chain-config';
import { network } from 'hardhat';
import { error } from 'console';

const contractName = 'WXTZ'

const deploy: DeployFunction = async (hre) => {
  const { getNamedAccounts, ethers, deployments } = hre

  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  assert(deployer, 'Missing named deployer account')

  console.log(`Network: ${hre.network.name}`)
  console.log(`Deployer: ${deployer}`)

  // This is an external deployment pulled in from @layerzerolabs/lz-evm-sdk-v2
  //
  // @layerzerolabs/toolbox-hardhat takes care of plugging in the external deployments
  // from @layerzerolabs packages based on the configuration in your hardhat config
  //
  // For this to work correctly, your network config must define an eid property
  // set to `EndpointId` as defined in @layerzerolabs/lz-definitions
  //
  // For example:
  //
  // networks: {
  //   fuji: {
  //     ...
  //     eid: EndpointId.AVALANCHE_V2_TESTNET
  //   }
  // }
  const endpointV2Deployment = await hre.deployments.get('EndpointV2')

  const Token = await hre.ethers.getContractFactory(contractName)
  const signer = await ethers.getSigner(deployer)
  // use the chain-config file to set either the etherlink testnet id or the mainnet id
  const currentNetwork = network.config.chainId || 0;
  let etherlinkChainId;
  if (testnetChains.includes(currentNetwork)) {
    etherlinkChainId = 128123;
  } else if (mainnetChains.includes(currentNetwork)) {
    etherlinkChainId = 42793;
  } else {
    throw error(`The chain id used (${currentNetwork}) to deploy is not recognized, add it in the chain-config.ts file.`);
  }
  const token = await Token.connect(signer).deploy(
    etherlinkChainId,
    endpointV2Deployment.address,
    deployer,
  );
  await token.deployed();
  const address = await token.address;

  console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`);
  console.log(`If you want to verify the contract, here is the command:\n\n        npx hardhat verify ${address} --network ${hre.network.name} ${etherlinkChainId} ${endpointV2Deployment.address} ${deployer}\n`); 

  updateDeploymentFile(hre.network.name, {
    WXTZ: address,
  });
}

deploy.tags = [contractName]

export default deploy
