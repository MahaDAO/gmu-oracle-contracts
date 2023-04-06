import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify } from "../utils";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  // Get all the deployed smart contracts.
  const gaugeProxyAdmin = "0x575e143702a015d09F298663405d1eD7fD20f0dD";

  const factory = await ethers.getContractFactory("ChainlinkFixedPriceOracle");
  const initData = factory.interface.encodeFunctionData("initialize", [
    "MAHA/USD",
    "600000000000000000",
    deployer.address,
  ]);

  const implementation = await deployOrLoadAndVerify(
    `ChainlinkFixedPriceOracle-Impl`,
    "ChainlinkFixedPriceOracle",
    []
  );

  await deployOrLoadAndVerify(
    `ChainlinkFixedPriceOracle`,
    "TransparentUpgradeableProxy",
    [implementation.address, gaugeProxyAdmin, initData]
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
