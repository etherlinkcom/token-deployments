import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { deployments, ethers, upgrades } from 'hardhat'
import {Options} from '@layerzerolabs/lz-v2-utilities'

describe('tzBTC Test', function () {
  // Constant representing a mock Endpoint ID for testing purposes
  const eidA = 1
  const eidB = 2
  // Declaration of variables to be used in the test suite
  let tzBTCTokenFactory: ContractFactory
  let tzBTCAdapterFactory: ContractFactory
  let tzBTCDummyFactory: ContractFactory
  let EndpointV2Mock: ContractFactory
  let ownerToken: SignerWithAddress
  let ownerDummy: SignerWithAddress
  let endpointOwner: SignerWithAddress
  let tzBTCToken: Contract
  let tzBTCAdapter: Contract
  let tzBTCDummy: Contract
  let mockEndpointV2A: Contract
  let mockEndpointV2B: Contract

  // Before hook for setup that runs once before all tests in the block
  before(async function () {
    // Contract factory for our tested contract
    //
    // We are using a derived contract that exposes a mint() function for testing purposes
    tzBTCTokenFactory = await ethers.getContractFactory('tzBTCTokenAdapted')
    tzBTCAdapterFactory = await ethers.getContractFactory('tzBTCAdapter')
    tzBTCDummyFactory = await ethers.getContractFactory('tzBTCDummy')

    // Fetching the first three signers (accounts) from Hardhat's local Ethereum network
    const signers = await ethers.getSigners()

    ownerToken = signers.at(0)!
    ownerDummy = signers.at(1)!
    endpointOwner = signers.at(3)!

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
    tzBTCToken = await upgrades.deployProxy(tzBTCTokenFactory, [ownerToken.address], { initializer: 'initialize', kind: 'uups' });
    tzBTCAdapter = await tzBTCAdapterFactory.connect(ownerToken).deploy(tzBTCToken.address, mockEndpointV2A.address, ownerToken.address)
    tzBTCDummy = await tzBTCDummyFactory.connect(ownerDummy).deploy(mockEndpointV2B.address, ownerDummy.address)

    // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
    await mockEndpointV2A.setDestLzEndpoint(tzBTCDummy.address, mockEndpointV2B.address)
    await mockEndpointV2B.setDestLzEndpoint(tzBTCAdapter.address, mockEndpointV2A.address)

    // Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
    await tzBTCAdapter.connect(ownerToken).setPeer(eidB, ethers.utils.zeroPad(tzBTCDummy.address, 32))
    await tzBTCDummy.connect(ownerDummy).setPeer(eidA, ethers.utils.zeroPad(tzBTCAdapter.address, 32))
  })

  // Test that the constructor set the correct owner even if it is deployed but someone else
  it('should be the correct owner', async function () {
    // Test already deployed ones
    const tokenOwner = await tzBTCToken.owner();
    const adapterOwner = await tzBTCAdapter.owner();
    const dummyOwner = await tzBTCDummy.owner();
    expect(tokenOwner).to.equal(ownerToken.address);
    expect(adapterOwner).to.equal(ownerToken.address);
    expect(dummyOwner).to.equal(ownerDummy.address)

    // Test deployed by user A but owner should be new user
    const newUser = ethers.Wallet.createRandom();
    let newDummy = await tzBTCDummyFactory.connect(ownerDummy).deploy(mockEndpointV2A.address, newUser.address);
    const OFTOwner = await newDummy.owner();
    expect(OFTOwner).to.equal(newUser.address);
  });

  it("should allow owner to mint and burn via tzBTCToken", async function () {
    // Test owner mint 1 tzBTC
    const supply = BigInt("1000000000000000000")
    await tzBTCToken.connect(ownerToken).mint(ownerToken.address, supply)
    const ownerMintAmount = await tzBTCToken.balanceOf(ownerToken.address)
    expect(ownerMintAmount.toString()).to.equal(supply.toString())

    // Test owner burn 1 tzBTC
    await tzBTCToken.connect(ownerToken).burn(ownerToken.address, supply)
    const ownerBurnAmount = await tzBTCToken.balanceOf(ownerToken.address)
    expect(ownerBurnAmount.toString()).to.equal('0')
  })

  it("should not allow non-owner to mint and burn via tzBTCToken", async function () {
    // Test non-owner can't mint tzBTC
    const supply = BigInt("1000000000000000000")
    await expect(tzBTCToken.connect(ownerDummy).mint(ownerToken.address, supply)).to.be.reverted;

    // Test non-owner can't burn tzBTC
    await tzBTCToken.connect(ownerToken).mint(ownerToken.address, supply)
    await expect(tzBTCToken.connect(ownerDummy).burn(ownerToken.address, supply)).to.be.reverted;
  })

  it("should be able to send tzBTC from mock chain A to mock chain B and back via OFT", async function () {
    // ------- SEND tzBTC FROM ORIGINAL CHAIN -----------
    // Mint initial supply of tokens
    const supply = BigInt("1000000000000000000")
    await tzBTCToken.connect(ownerToken).mint(ownerToken.address, supply)

    // Approve the tzBTCAdapter contract to spend tokens on behalf of ownerToken
    await tzBTCToken.connect(ownerToken).approve(tzBTCAdapter.address, supply);

    // Defining extra message execution options for the send operation
    const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

    // Construct the parameters for the send operation
    var sendParam = {
        dstEid: eidB,
        to: ethers.utils.zeroPad(ownerDummy.address, 32),
        amountLD: supply,
        minAmountLD: supply,
        extraOptions: options,
        composeMsg: "0x", // Assuming no composeMsg
        oftCmd: "0x" // Assuming no oftCmd
    };

    // Fetching the native fee for the token send operation
    var [nativeFee] = await tzBTCAdapter.quoteSend(sendParam, false);

    // Executing the send operation from tzBTCAdapter contract
    await tzBTCAdapter.send(sendParam, [nativeFee, 0], tzBTCAdapter.address, {
        value: nativeFee,
    });

    // Fetching the final token balances of ownerA and ownerB
    var finalBalanceToken = await tzBTCToken.balanceOf(ownerToken.address);
    var finalBalanceDummy = await tzBTCDummy.balanceOf(ownerDummy.address);

    // Asserting that the final balances are as expected after the send operation
    expect(finalBalanceToken).to.equal('0')
    expect(finalBalanceDummy).to.equal(supply.toString())

    // ------- SEND tzBTC BACK TO ORIGINAL CHAIN -----------
    // Construct the parameters for the send operation
    sendParam = {
        dstEid: eidA,
        to: ethers.utils.zeroPad(ownerToken.address, 32),
        amountLD: supply,
        minAmountLD: supply,
        extraOptions: options,
        composeMsg: "0x", // Assuming no composeMsg
        oftCmd: "0x" // Assuming no oftCmd
    };
    
    // Fetching the native fee for the token send operation
    [nativeFee] = await tzBTCDummy.quoteSend(sendParam, false);

    // Executing the send operation from tzBTCDummy contract
    await tzBTCDummy.send(sendParam, [nativeFee, 0], tzBTCDummy.address, {
        value: nativeFee,
    });

    // Fetching the final token balances of ownerA and ownerB
    finalBalanceToken = await tzBTCToken.balanceOf(ownerToken.address);
    finalBalanceDummy = await tzBTCDummy.balanceOf(ownerDummy.address);

    // Asserting that the final balances are as expected after the send operation
    expect(finalBalanceToken).to.equal(supply.toString())
    expect(finalBalanceDummy).to.equal('0')
  })

  it("should be able to transfer owner", async function () {
    await tzBTCDummy.transferOwnership(ownerToken.address)
    await tzBTCToken.transferOwnership(ownerDummy.address)

    expect(await tzBTCDummy.owner()).to.equal(ownerToken.address)
    expect(await tzBTCToken.owner()).to.equal(ownerDummy.address)
  })

  it("shouldn't be able to burn non-existing tzBTC", async function () {
    expect(tzBTCToken.burn(ownerToken.address, 10)).to.be.reverted
  })
})
