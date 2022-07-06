// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { wait } from "./utils";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const history30d = [
    1804.58, 1806.22, 1859.84, 1813.33, 1791.88, 1788.8, 1662.91, 1532.89,
    1434.84, 1209.35, 1208.9, 1237.53, 1068.5, 1086.93, 995.12, 1128.53,
    1128.24, 1125.86, 1050.19, 1144.71, 1225.02, 1242.31, 1197.79, 1192.51,
    1144.05, 1100.21, 1071.02, 1059.73, 1067.01, 1074.26,
  ];

  const one = BigNumber.from(10).pow(18);

  const history30dBN = history30d.map((h) =>
    BigNumber.from(Math.floor(h * 100))
      .mul(one)
      .div(100)
  );

  const startingPrice = one.mul(2);
  const oracle = "0x4c517d4e2c851ca76d7ec94b805269df0f2201de";

  // // We get the contract to deploy
  const GMUOracle = await ethers.getContractFactory("GMUOracle");
  const instance = await GMUOracle.deploy(startingPrice, oracle, history30dBN);

  await instance.deployed();

  console.log("GMUOracle deployed to:", instance.address);

  await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: instance.address,
    constructorArguments: [startingPrice, oracle, history30dBN],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
