// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { wait } from "./utils";

async function main() {
  const oracles = [
    "0x93dAe7A7763f95eC86006D9f38A497773ce47380",
    "0x6852F8bB8a476fCAD8D6a54aF4a1A61B29146484",
  ];

  // We get the contract to deploy
  const Factory = await ethers.getContractFactory("ChainlinkTWAPKeeper");
  const instance = await Factory.deploy(oracles);

  await instance.deployed();

  console.log("ChainlinkTWAPKeeper deployed to:", instance.address);

  await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: instance.address,
    constructorArguments: [oracles],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
