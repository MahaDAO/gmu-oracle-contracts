import { utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script`);

  // Initialize the wallet.
  const wallet = new Wallet(process.env.PRIVATE_KEY || "");

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, wallet);
  // Load contract
  const artifact = await deployer.loadArtifact("PythNetworkOracle");

  const pyth = "0xf087c864AEccFb6A2Bf1Af6A0382B0d0f6c5D834";
  const feedId =
    "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b";

  // Deploy this contract. The returned object will be of a `Contract` type,
  // similar to the ones in `ethers`.
  const greeterContract = await deployer.deploy(artifact, [pyth, feedId], {
    gasPrice: 1000000000,
  });

  // // Show the contract info.
  console.log(
    `${artifact.contractName} was deployed to ${greeterContract.address}`
  );

  console.log("val", await greeterContract.callStatic.fetchPrice());

  await hre.run("verify:verify", {
    address: greeterContract.address,
    constructorArguments: [pyth, feedId],
  });
}

// // We require the Hardhat Runtime Environment explicitly here. This is optional
// // but useful for running the script in a standalone fashion through `node <script>`.
// //
// // When running the script with `npx hardhat run <script>` you'll find the Hardhat
// // Runtime Environment's members available in the global scope.
// import hre, { ethers } from "hardhat";
// import { wait } from "./utils";

// async function main() {
//   // const chainlinkOracle = "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419";
//   // const token = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
//   // const gmuOracle = "0x288961ee2805a1961d6a98092aa83B00F3065514";

//   // We get the contract to deploy
//   const PythNetworkOracle = await ethers.getContractFactory(
//     "PythNetworkOracle"
//   );
//   const instance = await PythNetworkOracle.deploy(pyth, feedId);

//   await instance.deployed();

//   console.log("PythNetworkOracle deployed to:", instance.address);

//   console.log("price:", await instance.fetchPrice());

//   // await wait(60 * 1000); // wait for a minute

//   // await hre.run("verify:verify", {
//   //   address: instance.address,
//   //   constructorArguments: [chainlinkOracle, gmuOracle, token],
//   // });
// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
