// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress, wait } from "./utils";

async function main() {
  const gmuOracle = await getOutputAddress("GMUOracle", "ethereum");

  const instance = await deployOrLoadAndVerify(
    "GMUUSDAggregatorV3",
    "GMUUSDAggregatorV3",
    [gmuOracle]
  );

  console.log("GMUUSDAggregatorV3 deployed to:", instance.address);
  console.log("getRoundData", await instance.getRoundData(1));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
