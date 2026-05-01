import assert from 'assert'

import { type DeployFunction } from 'hardhat-deploy/types'

const TEZOS_X_PREVIEWNET = 'tezosXPreviewnet'

const deploy: DeployFunction = async (hre) => {
    const { getNamedAccounts, deployments } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    assert(deployer, 'Missing named deployer account')

    console.log(`Network: ${hre.network.name}`)
    console.log(`Deployer: ${deployer}`)

    // Deploys the previewnet-only LayerZero endpoint stub and registers it under
    // the name "EndpointV2" so that hre.deployments.get('EndpointV2') resolves
    // to the stub on this network. The OApp constructor's only endpoint call
    // (setDelegate) is satisfied; cross-chain send/receive will not work.
    const result = await deploy('EndpointV2', {
        contract: 'EndpointV2Stub',
        from: deployer,
        args: [],
        log: true,
    })

    console.log(`EndpointV2Stub deployed to ${result.address} (saved as 'EndpointV2')`)
}

deploy.tags = ['EndpointV2Stub']
deploy.skip = async (hre) => hre.network.name !== TEZOS_X_PREVIEWNET

export default deploy
