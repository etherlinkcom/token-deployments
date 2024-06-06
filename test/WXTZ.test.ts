import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract, ContractFactory } from 'ethers'
import { formatBytes32String } from '../scripts/utils'
import { deployments, ethers } from 'hardhat'
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe('WXTZ Test', function () {
  // Constant representing a mock Endpoint ID for testing purposes
  const eidA = 1
  const eidB = 2
  // Declaration of variables to be used in the test suite
  let WXTZFactory: ContractFactory
  let EndpointV2Mock: ContractFactory
  let ownerA: SignerWithAddress
  let ownerB: SignerWithAddress
  let endpointOwner: SignerWithAddress
  let wxtzA: Contract
  let wxtzB: Contract
  let mockEndpointV2A: Contract
  let mockEndpointV2B: Contract

  // Before hook for setup that runs once before all tests in the block
  before(async function () {
    // Contract factory for our tested contract
    //
    // We are using a derived contract that exposes a mint() function for testing purposes
    WXTZFactory = await ethers.getContractFactory('WXTZ')

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
    wxtzA = await WXTZFactory.connect(ownerA).deploy(128123, mockEndpointV2A.address, ownerA.address)
    wxtzB = await WXTZFactory.connect(ownerB).deploy(128123, mockEndpointV2B.address, ownerB.address)

    // Setting destination endpoints in the LZEndpoint mock for each MyOFT instance
    await mockEndpointV2A.setDestLzEndpoint(wxtzB.address, mockEndpointV2B.address)
    await mockEndpointV2B.setDestLzEndpoint(wxtzA.address, mockEndpointV2A.address)

    // Set the timelock for `setPeer()` on first call
    await wxtzA.connect(ownerA).setPeer(eidB, ethers.utils.zeroPad(wxtzB.address, 32));
    await wxtzB.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(wxtzA.address, 32));

    // advance time by 3 days and mine a new block
    await time.increase(259200);

    // Setting each MyOFT instance as a peer of the other in the mock LZEndpoint
    await wxtzA.connect(ownerA).setPeer(eidB, ethers.utils.zeroPad(wxtzB.address, 32))
    await wxtzB.connect(ownerB).setPeer(eidA, ethers.utils.zeroPad(wxtzA.address, 32))
  })

  // Test that the constructor set the correct owner even if it is deployed but someone else
  it('Should be the correct owner', async function () {
    // Test already deployed ones
    const wxtzAOwner = await wxtzA.owner();
    const wxtzBOwner = await wxtzB.owner();
    expect(wxtzAOwner).to.equal(ownerA.address);
    expect(wxtzBOwner).to.equal(ownerB.address);

    // Test deployed by user A but owner should be new user
    const newUser = ethers.Wallet.createRandom();
    let newOFT = await WXTZFactory.connect(ownerA).deploy(128123, mockEndpointV2A.address, newUser.address);
    const OFTOwner = await newOFT.owner();
    expect(OFTOwner).to.equal(newUser.address);
  });

  // A test case to verify token deposit and withdraw functionality
  // WARNING: you can only deposit and withdraw on Etherlink testnet and mainnet
  it('Should be able to exchange XTZ for WXTZ 1:1', async function () {
    // Check initial balances
    const initialXTZ = await ethers.provider.getBalance(ownerA.address);
    const initialWXTZ = await wxtzA.balanceOf(ownerA.address);
    const initialTotalSupply = await wxtzA.totalSupply()

    expect(initialXTZ.toString()).eq("10000000000000000000000")
    expect(initialWXTZ.toString()).eq("0")
    expect(initialTotalSupply.toString()).eq("0")

    // Check deposit with non-owner account leads to correct exchange of XTZ for WXTZ
    await wxtzA.connect(ownerB).deposit({ value: ethers.utils.parseEther("1") });

    const depositXTZ = await ethers.provider.getBalance(ownerB.address);
    const depositWXTZ = await wxtzA.balanceOf(ownerB.address);

    expect(depositXTZ.toString()).eq("9999000000000000000000")
    expect(depositWXTZ.toString()).eq("1000000000000000000")

    // Check withdraw with non-owner account leads to correct exchange of WXTZ for XTZ
    await wxtzA.connect(ownerB).withdraw(BigInt("1000000000000000000"));

    const withdrawXTZ = await ethers.provider.getBalance(ownerB.address);
    const withdrawWXTZ = await wxtzA.balanceOf(ownerB.address);

    expect(withdrawXTZ.toString()).eq("10000000000000000000000")
    expect(withdrawWXTZ.toString()).eq("0")
  })

  // Test that you can't withdraw if you don't have WXTZ even after an empty deposit 
  it("Shouldn't withdraw XTZ without depositing WXTZ", async function () {
    // Check initial balances
    const initialXTZ = await ethers.provider.getBalance(ownerA.address);
    const initialWXTZ = await wxtzA.balanceOf(ownerA.address);
    expect(initialWXTZ.toString()).to.equal('0');

    // Try to retrieve XTZ without having WXTZ
    await expect(wxtzA.withdraw(ethers.utils.parseEther("1"))).to.be.reverted;
    let afterWithdrawXTZ = await ethers.provider.getBalance(ownerA.address);
    expect(afterWithdrawXTZ.toString()).to.equal(initialXTZ.toString());

    // Test fake deposit before retrying
    wxtzA.deposit({ value: 0 });
    await expect(wxtzA.withdraw(ethers.utils.parseEther("1"))).to.be.reverted;
    afterWithdrawXTZ = await ethers.provider.getBalance(ownerA.address);
    expect(afterWithdrawXTZ.toString()).to.equal(initialXTZ.toString());
  });

  // Test that the deposit without giving XTZ doesn't give you WXTZ
  it("Shouldn't withdraw WXTZ without depositing XTZ", async function () {
    // Check initial balances
    const initialXTZ = await ethers.provider.getBalance(ownerA.address);
    const initialWXTZ = await wxtzA.balanceOf(ownerA.address);

    // call deposit but without tokens
    wxtzA.deposit({ value: 0 });

    // Checks balances after the call
    const afterDepositXTZ = await ethers.provider.getBalance(ownerA.address);
    const afterDepositWXTZ = await wxtzA.balanceOf(ownerA.address);
    // Balances should be the same after
    expect(afterDepositXTZ.toBigInt()).to.equal(initialXTZ.toBigInt());
    expect(afterDepositWXTZ.toBigInt()).to.equal(initialWXTZ.toBigInt());
  });

  // Test that you can't receive WXTZ on other chain if you don't own some
  it("Shouldn't send WXTZ cross chain if no WXTZ owned", async function () {
    // Check initial balances on token A and B are 0
    const initialWXTZOnA = await wxtzA.balanceOf(ownerA.address);
    const initialWXTZOnB = await wxtzB.balanceOf(ownerA.address);
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
    const estimatedGas = await wxtzA.quoteSend(
      sendParam,
      false // do we want to pay in lz token
    );

    // Should revert
    await expect(
      wxtzA.send(
        sendParam,
        estimatedGas, // messaging fee
        ownerA.address, // refund address
        { value: estimatedGas.nativeFee } // pay for the destination chain
      )
    ).to.be.reverted;

    // Check balances after the send on token A and B are 0
    const afterSendWXTZOnA = await wxtzA.balanceOf(ownerA.address);
    const afterSendWXTZOnB = await wxtzB.balanceOf(ownerA.address);
    expect(afterSendWXTZOnA.toString()).to.equal('0');
    expect(afterSendWXTZOnB.toString()).to.equal('0');
  });
})
