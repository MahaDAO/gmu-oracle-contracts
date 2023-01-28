// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { deployOrLoadAndVerify, wait } from "./utils";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const history30d = [
    "1312077850000000000000",
    "1275027983430000000000",
    "1203176520260000000000",
    "1178440434890000000000",
    "1182854058420000000000",
    "1170150578270000000000",
    "1215280000000000000000",
    "1209913052320000000000",
    "1189210000000000000000",
    "1218703890400000000000",
    "1221110000000000000000",
    "1202440000000000000000",
    "1213590000000000000000",
    "1206166100000000000000",
    "1196501056850000000000",
    "1197270000000000000000",
    "1197348083700000000000",
    "1199080227980000000000",
    "1200488690690000000000",
    "1218550616440000000000",
    "1207036699290000000000",
    "1257510430360000000000",
    "1646287100000000000000",
    "1629493700000000000000",
    "1646631488020000000000",
    "1616351620650000000000",
    "1620649200000000000000",
    "1554551880000000000000",
    "1599215930000000000000",
    "1620023336670000000000",
  ];

  const startingPrice = "2098515933448364426";

  // liquity's ETH/USD pricefeed
  const oracle = "0x4c517d4e2c851ca76d7ec94b805269df0f2201de";

  // // We get the contract to deploy
  const instance = await deployOrLoadAndVerify("GMUOracle", "GMUOracle", [
    startingPrice,
    oracle,
    history30d,
  ]);

  console.log("GMUOracle deployed to:", instance.address);

  console.log(
    "fetchLastGoodPrice",
    (await instance.fetchLastGoodPrice()).toString()
  );
  console.log("lastPrice30d", (await instance.lastPrice30d()).toString());
  console.log("lastPrice7d", (await instance.lastPrice7d()).toString());
  // await wait(60 * 1000); // wait for a minute

  // await hre.run("verify:verify", {
  //   address: instance.address,
  //   constructorArguments: [startingPrice, oracle, history30d],
  // });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
