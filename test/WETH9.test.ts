import { expect } from 'chai'
import {ethers} from "hardhat"

// Testing WETH9 to validate behaviour in WXTZ
describe("WETH9 contract", function () {
  it("Should be able to deposit and withdraw ETH for WETH", async function () {
    // deploy contract
    const [owner] = await ethers.getSigners();
    const weth9 = await ethers.deployContract("WETH9");

    // Check inital balances
    const initialETH = await ethers.provider.getBalance(owner.address);
    const initialWETH = await weth9.balanceOf(owner.address);
    const initialTotalSupply = await weth9.totalSupply()

    expect(initialETH.toString()).eq("10000000000000000000000")
    expect(initialWETH.toString()).eq("0")
    expect(initialTotalSupply.toString()).eq("0")

    // Check deposit leads to correct exchange of ETH for WETH
    await owner.sendTransaction({
        to: weth9.address,
        value: ethers.utils.parseEther("1")
    });

    const depositETH = await ethers.provider.getBalance(owner.address);
    const depositWETH = await weth9.balanceOf(owner.address);

    expect(depositETH.toString()).eq("9999000000000000000000")
    expect(depositWETH.toString()).eq("1000000000000000000")

    // Check withdraw leads to correct exchange of WETH for ETH
    await owner.sendTransaction({
        to: weth9.address,
        data: weth9.interface.encodeFunctionData("withdraw", [BigInt("1000000000000000000")])
    });

    const withdrawETH = await ethers.provider.getBalance(owner.address);
    const withdrawWETH = await weth9.balanceOf(owner.address);

    expect(withdrawETH.toString()).eq("10000000000000000000000")
    expect(withdrawWETH.toString()).eq("0")
  });
});