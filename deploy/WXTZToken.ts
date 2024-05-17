import assert from 'assert'
import { writeFileSync } from 'fs'

import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'WXTZToken'

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

  const Token = await hre.ethers.getContractFactory("WXTZToken")
  const signer = await ethers.getSigner(deployer)
  const token = await Token.connect(signer).deploy(
    endpointV2Deployment.address,
    deployer,
  );
  const address = await token.address;

  console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`)

  writeFileSync(
    `./deployments/${hre.network.name}.json`,
    JSON.stringify(
      {
        WXTZToken: address,
      },
      null,
      2
    )
  );
}

deploy.tags = [contractName]

export default deploy
