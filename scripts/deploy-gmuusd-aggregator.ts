// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { wait } from "./utils";

async function main() {
  const gmuOracle = "0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00";

  // We get the contract to deploy
  const GMUUSDAggregatorV3 = await ethers.getContractFactory(
    "GMUUSDAggregatorV3"
  );
  const instance = await GMUUSDAggregatorV3.deploy(gmuOracle);

  await instance.deployed();

  console.log("GMUUSDAggregatorV3 deployed to:", instance.address);

  await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: instance.address,
    constructorArguments: [gmuOracle],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
