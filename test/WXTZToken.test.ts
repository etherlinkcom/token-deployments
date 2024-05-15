import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber, Contract, ContractFactory } from 'ethers'
import { deployments, ethers } from 'hardhat'


describe('WXTZ Test', function () {
    // Constant representing a mock Endpoint ID for testing purposes
    const eidA = 1
    const eidB = 2
    // Declaration of variables to be used in the test suite
    let MyOFT: ContractFactory
    let EndpointV2Mock: ContractFactory
    let ownerA: SignerWithAddress
    let ownerB: SignerWithAddress
    let endpointOwner: SignerWithAddress
    let myOFTA: Contract
    let myOFTB: Contract
    let mockEndpointV2A: Contract
    let mockEndpointV2B: Contract

    // Before hook for setup that runs once before all tests in the block
    before(async function () {
        // Contract factory for our tested contract
        //
        // We are using a derived contract that exposes a mint() function for testing purposes
        MyOFT = await ethers.getContractFactory('WXTZToken')

        // Fetching the first three signers (accounts) from Hardhat's local Ethereum network
        const signers = await ethers.getSigners()

        ownerA = signers.at(0)!
        ownerB = signers.at(1)!
        endpointOwner = signers.at(2)!

        // The EndpointV2Mock contract comes from @layerzerolabs/test-devtools-evm-hardhat package
        // and its artifacts are connected as external artifacts to this project
        //
        // Unfortunately, hardhat itself does not yet provide a way of connecting external artifacts,
        // so we rely on hardhat-deploy to create a ContractFactory for EndpointV2Mock
        //
        // See https://github.com/NomicFoundation/hardhat/issues/1040
        const EndpointV2MockArtifact = await deployments.getArtifact('EndpointV2Mock')
        EndpointV2Mock = new ContractFactory(EndpointV2MockArtifact.abi, EndpointV2MockArtifact.bytecode, endpointOwner)
    })

    // beforeEach hook for setup that runs before each test in the block
    beforeEach(async function () {
        // Deploying a mock LZEndpoint with the given Endpoint ID
        mockEndpointV2A = await EndpointV2Mock.deploy(eidA)
        mockEndpointV2B = await EndpointV2Mock.deploy(eidB)

        // Deploying two instances of MyOFT contract with different identifiers and linking them to the mock LZEndpoint
        myOFTA = await MyOFT.deploy(ownerA.address, mockEndpointV2A.address)
        myOFTB = await MyOFT.deploy(ownerB.address, mockEndpointV2B.address)

        // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
        await mockEndpointV2A.setDestLzEndpoint(myOFTB.address, mockEndpointV2B.address)
        await mockEndpointV2B.setDestLzEndpoint(myOFTA.address, mockEndpointV2A.address)

        // Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
        await myOFTA.connect(ownerA).setPeer(eidB, ethers.utils.zeroPad(myOFTB.address, 32))
        await myOFTB.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(myOFTA.address, 32))
    })

    // A test case to verify token transfer functionality
    it('should be able to deposit and withdraw XTZ for WXTZ', async function () {
        // Minting an initial amount of tokens to ownerA's address in the myOFTA contract
        const initialXTZ = await ethers.provider.getBalance(ownerA.address);
        const initialWXTZ = await myOFTA.balanceOf(ownerA.address);
        const initialTotalSupply = await myOFTA.totalSupply()

        expect(initialWXTZ.toString()).eq("0")
        expect(initialTotalSupply.toString()).eq("0")

        await ownerA.sendTransaction({
            to: myOFTA.address,
            value: ethers.utils.parseEther("1")
        });

        const depositXTZ = await ethers.provider.getBalance(ownerA.address);
        const depositWXTZ = await myOFTA.balanceOf(ownerA.address);

        expect(depositWXTZ.toString()).eq("1000000000000000000")

        await ownerA.sendTransaction({
            to: myOFTA.address,
            data: myOFTA.interface.encodeFunctionData("withdraw", [BigInt("1000000000000000000")])
        });

        const withdrawXTZ = await ethers.provider.getBalance(ownerA.address);
        const withdrawWXTZ = await myOFTA.balanceOf(ownerA.address);

        expect(withdrawWXTZ.toString()).eq("0")
    })
})
