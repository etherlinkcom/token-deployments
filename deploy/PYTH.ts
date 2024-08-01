import assert from 'assert'
import { type DeployFunction } from 'hardhat-deploy/types'
import { updateDeploymentFile } from '../scripts/utils'
import { testnetChains, mainnetChains } from '../chain-config';
import { network } from 'hardhat';
import { error } from 'console';

const contractName = 'PYTH'

const deploy: DeployFunction = async (hre) => {
  const { getNamedAccounts, ethers, deployments } = hre

  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  assert(deployer, 'Missing named deployer account')

  console.log(`Network: ${hre.network.name}`)
  console.log(`Deployer: ${deployer}`)

  const Token = await hre.ethers.getContractFactory(contractName)
  const signer = await ethers.getSigner(deployer)
  const wrappedBridgeAddress = "0x1f8E735f424B7A49A885571A2fA104E8C13C26c7"
  const token = await Token.connect(signer).deploy(
    wrappedBridgeAddress
  );
  await token.deployed(); // error on Mainnet and Bsc but not a failing deployment
  const address = await token.address;

  console.log(`Deployed contract: ${contractName}, network: ${hre.network.name}, address: ${address}`);
  console.log(`If you want to verify the contract, here is the command:\n\n        npx hardhat verify ${address} --network ${hre.network.name} ${wrappedBridgeAddress}\n`); 

  updateDeploymentFile(hre.network.name, {
    PYTH: address,
  });
}

deploy.tags = [contractName]

export default deploy
