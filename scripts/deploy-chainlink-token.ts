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

  const price = 2e6;
  const chainlinkOracle = "0x6Ebc52C8C1089be9eB3945C4350B68B8E4C2233f";
  const token = "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0";
  const gmuOracle = "0x288961ee2805a1961d6a98092aa83B00F3065514";

  // // We get the contract to deploy
  // const ChainlinkTokenOracleGMU = await ethers.getContractFactory(
  //   "ChainlinkTokenOracleGMU"
  // );
  // const instance = await ChainlinkTokenOracleGMU.deploy(
  //   chainlinkOracle,
  //   gmuOracle,
  //   token
  // );

  // await instance.deployed();

  // console.log("ChainlinkTokenOracleGMU deployed to:", instance.address);

  // await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: "0xe448dd09596Cc32677613C14F52FCd72fa0a984b",
    constructorArguments: [chainlinkOracle, gmuOracle, token],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
