// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { wait } from "./utils";

async function main() {
  const oracles = [
    "0x37d03409994114dd947fb76ad942fe324632d8c7",
    "0x71f8ae4e53b308000739986f9222cc47df9aed69",
  ];

  // We get the contract to deploy
  // const Factory = await ethers.getContractFactory("ChainlinkTWAPKeeper");
  // const instance = await Factory.deploy(oracles);

  // await instance.deployed();

  // console.log("ChainlinkTWAPKeeper deployed to:", instance.address);

  // await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: "0xB2CE8B19756A46f3EE438aC18ecC3321e9e35B2E",
    constructorArguments: [oracles],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
