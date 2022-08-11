// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { wait } from "./utils";

async function main() {
  const gmu = "0x7ee5010cbd5e499b7d66a7cba2ec3bde5fca8e00";
  const maha = "0xb4d930279552397bba2ee473229f89ec245bc365";
  const reward = BigNumber.from(10).pow(19);

  // We get the contract to deploy
  const Factory = await ethers.getContractFactory("MahaKeeper");
  const instance = await Factory.deploy(gmu, reward, maha);

  await instance.deployed();

  console.log("MahaKeeper deployed to:", instance.address);

  await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: instance.address,
    constructorArguments: [gmu, reward, maha],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
