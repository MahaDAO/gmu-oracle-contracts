// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { wait } from "./utils";

async function main() {
  const chainlinkOracle = "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419";
  const token = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const gmuOracle = "0x288961ee2805a1961d6a98092aa83B00F3065514";

  // We get the contract to deploy
  const ChainlinkTokenOracleGMU = await ethers.getContractFactory(
    "ChainlinkTokenOracleGMU"
  );
  const instance = await ChainlinkTokenOracleGMU.deploy(
    chainlinkOracle,
    gmuOracle,
    token
  );

  await instance.deployed();

  console.log("ChainlinkTokenOracleGMU deployed to:", instance.address);

  await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: instance.address,
    constructorArguments: [chainlinkOracle, gmuOracle, token],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
