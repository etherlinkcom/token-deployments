import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber, Contract, ContractFactory } from 'ethers'
import { formatBytes32String } from '../scripts/utils'
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
    MyOFT = await ethers.getContractFactory('WXTZ')

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
    myOFTA = await MyOFT.connect(ownerA).deploy(128123, mockEndpointV2A.address, ownerA.address)
    myOFTB = await MyOFT.connect(ownerB).deploy(128123, mockEndpointV2B.address, ownerB.address)

    // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
    await mockEndpointV2A.setDestLzEndpoint(myOFTB.address, mockEndpointV2B.address)
    await mockEndpointV2B.setDestLzEndpoint(myOFTA.address, mockEndpointV2A.address)

    // Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
    await myOFTA.connect(ownerA).setPeer(eidB, ethers.utils.zeroPad(myOFTB.address, 32))
    await myOFTB.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(myOFTA.address, 32))
  })

  // Test that the constructor set the correct owner even if it is deployed but someone else
  it('should be the correct owner', async function () {
    // Test already deployed ones
    const OFTAOwner = await myOFTA.owner();
    const OFTBOwner = await myOFTB.owner();
    expect(OFTAOwner).to.equal(ownerA.address);
    expect(OFTBOwner).to.equal(ownerB.address);

    // Test deployed by user A but owner should be new user
    const newUser = ethers.Wallet.createRandom();
    let newOFT = await MyOFT.connect(ownerA).deploy(128123, mockEndpointV2A.address, newUser.address);
    const OFTOwner = await newOFT.owner();
    expect(OFTOwner).to.equal(newUser.address);
  });

  // A test case to verify token deposit and withdraw functionality
  // WARNING: you can only deposit and withdraw on Etherlink testnet and mainnet
  it('should be able to deposit and withdraw XTZ for WXTZ', async function () {
    // Check initial balances
    const initialXTZ = await ethers.provider.getBalance(ownerA.address);
    const initialWXTZ = await myOFTA.balanceOf(ownerA.address);
    const initialTotalSupply = await myOFTA.totalSupply()

    expect(initialXTZ.toString()).eq("10000000000000000000000")
    expect(initialWXTZ.toString()).eq("0")
    expect(initialTotalSupply.toString()).eq("0")

    // Check deposit with non-owner account leads to correct exchange of XTZ for WXTZ
    await myOFTA.connect(ownerB).deposit({ value: ethers.utils.parseEther("1") });

    const depositXTZ = await ethers.provider.getBalance(ownerB.address);
    const depositWXTZ = await myOFTA.balanceOf(ownerB.address);

    expect(depositXTZ.toString()).eq("9999000000000000000000")
    expect(depositWXTZ.toString()).eq("1000000000000000000")

    // Check withdraw with non-owner account leads to correct exchange of WXTZ for XTZ
    await myOFTA.connect(ownerB).withdraw(BigInt("1000000000000000000"));

    const withdrawXTZ = await ethers.provider.getBalance(ownerB.address);
    const withdrawWXTZ = await myOFTA.balanceOf(ownerB.address);

    expect(withdrawXTZ.toString()).eq("10000000000000000000000")
    expect(withdrawWXTZ.toString()).eq("0")
  })

  // Test you can deposit in WXTZ A and then send it to the WXTZ B
  it('should deposit in one contract and send it to an other one cross chain', async function () {
    // Check initial balances
    const initialWXTZOnA = await myOFTA.balanceOf(ownerA.address);
    const initialWXTZOnB = await myOFTB.balanceOf(ownerA.address);
    const amount = ethers.utils.parseEther("1");

    // Should be empty at start
    expect(initialWXTZOnA.toString()).to.equal('0');
    expect(initialWXTZOnB.toString()).to.equal('0');

    // deposit some tokens in WXTZ A
    await myOFTA.deposit({ value: amount });
    const afterDepositWXTZOnA = await myOFTA.balanceOf(ownerA.address);
    expect(afterDepositWXTZOnA.toString()).to.equal(amount.toString());

    // On classic EVM, use 200000 wei (recommended by documentation)
    const extraOptions = "0x00030100110100000000000000000000000000030d40";
    // Estimate gas
    const sendParam = {
      dstEid: eidB, // Destination endpoint ID.
      to: formatBytes32String(ownerA.address), // Recipient address.
      amountLD: amount, // Amount to send in local decimals.
      minAmountLD: 0, // Minimum amount to send in local decimals.
      extraOptions: extraOptions, // Additional options supplied by the caller to be used in the LayerZero message.
      composeMsg: "0x", // The composed message for the send() operation.
      oftCmd: "0x", // The OFT command to be executed, unused in default OFT implementations.
    };
    const estimatedGas = await myOFTA.quoteSend(
      sendParam,
      false // do we want to pay in lz token
    );

    // send tokens from WXTZ A to WXTZ B cross chain
    await myOFTA.send(
      sendParam,
      estimatedGas, // messaging fee
      ownerA.address, // refund address
      { value: estimatedGas.nativeFee } // pay for the destination chain
    );

    // Check balance on chain A and B after send
    const afterSendWXTZOnA = await myOFTA.balanceOf(ownerA.address);
    expect(afterSendWXTZOnA.toString()).to.equal('0');
    const afterSendWXTZOnB = await myOFTB.balanceOf(ownerA.address);
    expect(afterSendWXTZOnB.toString()).to.equal(amount.toString());
  });

  // Test that you can't withdraw if you don't have WXTZ even after an empty deposit 
  it("shouldn't give you XTZ if you don't have WXTZ", async function () {
    // Check initial balances
    const initialXTZ = await ethers.provider.getBalance(ownerA.address);
    const initialWXTZ = await myOFTA.balanceOf(ownerA.address);
    expect(initialWXTZ.toString()).to.equal('0');

    // Try to retrieve XTZ without having WXTZ
    await expect(myOFTA.withdraw(ethers.utils.parseEther("1"))).to.be.reverted;
    let afterWithdrawXTZ = await ethers.provider.getBalance(ownerA.address);
    expect(afterWithdrawXTZ.toString()).to.equal(initialXTZ.toString());

    // Test fake deposit before retrying
    myOFTA.deposit({ value: 0 });
    await expect(myOFTA.withdraw(ethers.utils.parseEther("1"))).to.be.reverted;
    afterWithdrawXTZ = await ethers.provider.getBalance(ownerA.address);
    expect(afterWithdrawXTZ.toString()).to.equal(initialXTZ.toString());
  });

  // Test that the deposit without giving XTZ doesn't give you WXTZ
  it("shouldn't give you WXTZ if you don't send XTZ in the call", async function () {
    // Check initial balances
    const initialXTZ = await ethers.provider.getBalance(ownerA.address);
    const initialWXTZ = await myOFTA.balanceOf(ownerA.address);

    // call deposit but without tokens
    myOFTA.deposit({ value: 0 });

    // Checks balances after the call
    const afterDepositXTZ = await ethers.provider.getBalance(ownerA.address);
    const afterDepositWXTZ = await myOFTA.balanceOf(ownerA.address);
    // Balances should be the same after
    expect(afterDepositXTZ.toBigInt()).to.equal(initialXTZ.toBigInt());
    expect(afterDepositWXTZ.toBigInt()).to.equal(initialWXTZ.toBigInt());
  });

  // Test that you can't receive WXTZ on other chain if you don't own some
  it("shouldn't send the token cross chain if you don't have WXTZ", async function () {
    // Check initial balances on token A and B are 0
    const initialWXTZOnA = await myOFTA.balanceOf(ownerA.address);
    const initialWXTZOnB = await myOFTB.balanceOf(ownerA.address);
    expect(initialWXTZOnA.toString()).to.equal('0');
    expect(initialWXTZOnB.toString()).to.equal('0');

    // send token cross chain
    const extraOptions = "0x00030100110100000000000000000000000000030d40";
    const sendParam = {
      dstEid: eidB, // Destination endpoint ID.
      to: formatBytes32String(ownerA.address), // Recipient address.
      amountLD: ethers.utils.parseEther("1"), // Amount to send in local decimals.
      minAmountLD: 0, // Minimum amount to send in local decimals.
      extraOptions: extraOptions, // Additional options supplied by the caller to be used in the LayerZero message.
      composeMsg: "0x", // The composed message for the send() operation.
      oftCmd: "0x", // The OFT command to be executed, unused in default OFT implementations.
    };
    const estimatedGas = await myOFTA.quoteSend(
      sendParam,
      false // do we want to pay in lz token
    );

    // Should revert
    await expect(
      myOFTA.send(
        sendParam,
        estimatedGas, // messaging fee
        ownerA.address, // refund address
        { value: estimatedGas.nativeFee } // pay for the destination chain
      )
    ).to.be.reverted;

    // Check balances after the send on token A and B are 0
    const afterSendWXTZOnA = await myOFTA.balanceOf(ownerA.address);
    const afterSendWXTZOnB = await myOFTB.balanceOf(ownerA.address);
    expect(afterSendWXTZOnA.toString()).to.equal('0');
    expect(afterSendWXTZOnB.toString()).to.equal('0');
  });
})
