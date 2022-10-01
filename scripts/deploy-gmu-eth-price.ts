// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { wait } from "./utils";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const ethFeed = "0x4c517d4e2c851ca76d7ec94b805269df0f2201de";
  const gmuOracle = "0x7ee5010cbd5e499b7d66a7cba2ec3bde5fca8e00";

  const ETHGMUOracle = await ethers.getContractFactory("ETHGMUOracle");
  const instance = await ETHGMUOracle.deploy(ethFeed, gmuOracle);
  await instance.deployed();
  console.log("ETHGMUOracle deployed to:", instance.address);

  await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: instance.address,
    constructorArguments: [ethFeed, gmuOracle],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
