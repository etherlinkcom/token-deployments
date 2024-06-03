import assert from 'assert'
import { upgrades } from 'hardhat'
import { type DeployFunction } from 'hardhat-deploy/types'
import { updateDeploymentFile } from '../scripts/utils'

const contractName = 'tzBTCToken'

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

  const Token = await hre.ethers.getContractFactory("tzBTCToken");
  const tzBTCToken = await upgrades.deployProxy(Token, [deployer], { initializer: 'initialize', kind: 'uups', constructorArgs: [endpointV2Deployment.address], unsafeAllow: ['constructor', 'state-variable-immutable'] });
  await tzBTCToken.deployed();
  const tzBTCTokenLogic = await upgrades.erc1967.getImplementationAddress(tzBTCToken.address);

  console.log(`Deployed contract: ${contractName} proxy, network: ${hre.network.name}, address: ${tzBTCToken.address}`);
  console.log(`Deployed contract: ${contractName} implem, network: ${hre.network.name}, address: ${tzBTCTokenLogic}`);

  updateDeploymentFile(hre.network.name, {
    tzBTCTokenProxy: tzBTCToken.address,
    tzBTCTokenImplem: tzBTCTokenLogic,
  });
}

deploy.tags = [contractName]

export default deploy
