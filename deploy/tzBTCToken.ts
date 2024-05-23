import assert from 'assert'
import { writeFileSync } from 'fs'
import { upgrades } from 'hardhat'

import { type DeployFunction } from 'hardhat-deploy/types'

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

  // Deploy the ERC20 Upgradable contract tzBTC
  const Token = await hre.ethers.getContractFactory("tzBTCToken");
  const tzBTCToken = await upgrades.deployProxy(Token, [deployer], { initializer: 'initialize', kind: 'uups' });
  const tzBTCTokenLogic = await upgrades.erc1967.getImplementationAddress(tzBTCToken.address);

  // Deploy OFT Adapter
  const Adapter = await hre.ethers.getContractFactory("tzBTCAdapter");
  const adapter = await Adapter.deploy(tzBTCToken.address, endpointV2Deployment.address, deployer);

  console.log(`Deployed contract: ${contractName} proxy, network: ${hre.network.name}, address: ${tzBTCToken.address}`);
  console.log(`Deployed contract: ${contractName} implementation, network: ${hre.network.name}, address: ${tzBTCTokenLogic}`);
  console.log(`Deployed contract: ${contractName} adapter, network: ${hre.network.name}, address: ${adapter.address}`);

  writeFileSync(
    `./deployments/${hre.network.name}.json`,
    JSON.stringify(
      {
        tzBTCTokenProxy: tzBTCToken.address,
        tzBTCTokenImplem: tzBTCTokenLogic,
        tzBTCAdapter: adapter.address
      },
      null,
      2
    )
  );
}

deploy.tags = [contractName]

export default deploy
