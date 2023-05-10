// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumber } from "ethers";
import { /* deployOrLoadAndVerify */ deployOrLoadAndVerify } from "../utils";

async function main() {
  const tokenUSDTOracle = "0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7";
  const tokenUSDCOracle = "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3";
  const lpToken = "0x79bf7147ebcd0d55e83cb42ed3ba1bb2bb23ef20";
  const sequencer = "0xFdB631F5EE196F0ed6FAa767959853A9F217697D";

  // We get the contract to deploy
  const instance = await deployOrLoadAndVerify(
    "ChainlinkUniswapLPOracleWithSequencer",
    "ChainlinkUniswapLPOracleWithSequencer",
    [sequencer, tokenUSDTOracle, tokenUSDCOracle, lpToken]
  );

  const e18 = BigNumber.from(10).pow(18);
  console.log("fetchPrice():", (await instance.fetchPrice()).toString());
  console.log(
    "fetchPrice(300):",
    (await instance.fetchPrice()).mul(300).div(e18).toString()
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
