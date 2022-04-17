// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { wait } from "./utils";

async function main() {
  const chainlinkOracle = "0xfb82e32bcd4d72f0688f16109193053d52a23e47";
  const period = 86400;

  // We get the contract to deploy
  const TWAPOracle = await ethers.getContractFactory("TWAPOracle");
  const instance = await TWAPOracle.deploy(chainlinkOracle, period);

  await instance.deployed();

  console.log("TWAPOracle deployed to:", instance.address);

  await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: instance.address,
    constructorArguments: [chainlinkOracle, period],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
