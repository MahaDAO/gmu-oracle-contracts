// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress, wait } from "./utils";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const ethFeed = "0x4c517d4e2c851ca76d7ec94b805269df0f2201de";
  const gmuOracle = await getOutputAddress("GMUOracle", "ethereum");

  const instance = await deployOrLoadAndVerify("ETHGMUOracle", "ETHGMUOracle", [
    ethFeed,
    gmuOracle,
  ]);

  console.log("ETHGMUOracle deployed to:", instance.address);
  console.log("fetchPrice", await instance.callStatic.fetchPrice());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
