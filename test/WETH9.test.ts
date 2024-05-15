import { expect } from 'chai'
import {ethers} from "hardhat"

describe("WETH9 contract", function () {
  it("Should be able to deposit and withdraw ETH for WETH", async function () {
    const [owner] = await ethers.getSigners();

    const weth9 = await ethers.deployContract("WETH9");

    // Minting an initial amount of tokens to ownerA's address in the myOFTA contract
    const initialETH = await ethers.provider.getBalance(owner.address);
    const initialWETH = await weth9.balanceOf(owner.address);
    const initialTotalSupply = await weth9.totalSupply()

    expect(initialWETH.toString()).eq("0")
    expect(initialTotalSupply.toString()).eq("0")

    await owner.sendTransaction({
        to: weth9.address,
        value: ethers.utils.parseEther("1")
    });

    const depositETH = await ethers.provider.getBalance(owner.address);
    const depositWETH = await weth9.balanceOf(owner.address);

    expect(depositWETH.toString()).eq("1000000000000000000")

    await owner.sendTransaction({
        to: weth9.address,
        data: weth9.interface.encodeFunctionData("withdraw", [BigInt("1000000000000000000")])
    });

    const withdrawXTZ = await ethers.provider.getBalance(owner.address);
    const withdrawWXTZ = await weth9.balanceOf(owner.address);

    expect(withdrawWXTZ.toString()).eq("0")
  });
});