// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // We get the contract to deploy
  const oracle = await ethers.getContractAt(
    "GMUOracle",
    "0x7EE5010Cbd5e499b7d66a7cbA2Ec3BdE5fca8e00"
  );

  const max = (await oracle.lastPriceIndex()).toNumber();
  for (let index = max - 40; index < max; index++) {
    const p = await oracle.priceHistory(index);
    console.log(index, p.toString());
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
