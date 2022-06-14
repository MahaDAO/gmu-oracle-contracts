// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { wait } from "./utils";

async function main() {
  const tokenAoracle = "0xfe4a8cc5b5b2366c1b58bea3858e81843581b2f7";
  const tokenBoracle = "0x0a6513e40db6eb1b165753ad52e80663aea50545";
  const gmuOracle = "0xbe5514e856a4eb971653bcc74475b26b56763fd0";
  const lp = "0x2cf7252e74036d1da831d11089d326296e64a728";

  // We get the contract to deploy
  const ChainlinkLPOracleGMU = await ethers.getContractFactory(
    "ChainlinkLPOracleGMU"
  );
  const instance = await ChainlinkLPOracleGMU.deploy(
    tokenAoracle,
    tokenBoracle,
    gmuOracle,
    lp
  );

  await instance.deployed();

  console.log("ChainlinkLPOracleGMU deployed to:", instance.address);

  await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: instance.address,
    constructorArguments: [tokenAoracle, tokenBoracle, gmuOracle, lp],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
