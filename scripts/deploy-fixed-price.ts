import { BigNumber } from "ethers";
import { wait } from "./utils";
import hre, { ethers } from "hardhat";

async function main() {
  const one = BigNumber.from(10).pow(18);

  const startingPrice = one.mul(10000);
  const governance = "0xeccE08c2636820a81FC0c805dBDC7D846636bbc4";

  // We get the contract to deploy
  const GMUOracle = await ethers.getContractFactory("FixedPrice");
  const instance = await GMUOracle.deploy(
    "FixedPrice",
    startingPrice,
    governance
  );

  await instance.deployed();

  console.log("FixedPrice deployed to:", instance.address);

  await wait(60 * 1000); // wait for a minute

  await hre.run("verify:verify", {
    address: instance.address,
    constructorArguments: ["FixedPrice", startingPrice, governance],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
