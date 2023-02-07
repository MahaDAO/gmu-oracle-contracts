import { deployOrLoadAndVerify, getOutputAddress } from "./utils";

async function main() {
  const gmuOracle = await getOutputAddress("GMUOracle", "ethereum");

  const instance = await deployOrLoadAndVerify(
    "MAHAUniswapV3ChainlinkOracle",
    "MAHAUniswapV3ChainlinkOracle",
    [
      "0x8a039FB7503B914A9cb2a004010706ca192377Bc", // address _pool,
      gmuOracle, // address _gmuOracle,
      "0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71", // address _arth,
      "0x745407c86DF8DB893011912d3aB28e68B62E49B0", // address _maha,
      10000, // uint24 _fee
    ]
  );

  console.log(
    "fetchPriceInARTH",
    (await instance.fetchPriceInARTH()).toString()
  );
  console.log("fetchPrice", (await instance.fetchPrice()).toString());
  console.log("latestRoundData", await instance.latestRoundData());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
