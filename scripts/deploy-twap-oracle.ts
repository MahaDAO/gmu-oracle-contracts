// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { wait } from "./utils";

async function main() {
  const chainlinkOracle = "0xe2e6829cdd6d7d546c13bf3aa346160e62f91a38";
  const period = 86400;
  const percision = BigNumber.from(10).pow(9).mul(2);

  // // We get the contract to deploy
  // const TWAPOracle = await ethers.getContractFactory("TWAPOracle");
  // const instance = await TWAPOracle.deploy(chainlinkOracle, period, percision);

  // await instance.deployed();

  // console.log("TWAPOracle deployed to:", instance.address);

  // await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: "0x2658140C0981e1d179482226b0e382350C9C8b18",
    constructorArguments: [chainlinkOracle, period, percision],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
