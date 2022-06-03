import chai, { expect } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { Contract, ContractFactory, BigNumber, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

chai.use(solidity);

describe("Appreciating Oracle", () => {
  const CHAINLINK_PRECISION = BigNumber.from(10).pow(8);
  const GMU_PRECISION = BigNumber.from(10).pow(6);

  let operator: SignerWithAddress;

  before("Setup accounts", async () => {
    [operator] = await ethers.getSigners();
  });

  let MockChainlinkAggregator: ContractFactory;
  let AppreciatingOracle: ContractFactory;
  let mockChainlinkAggregator: Contract;
  let appreciatingOracle: Contract;

  before("Fetch contract factories", async () => {
    MockChainlinkAggregator = await ethers.getContractFactory(
      "MockChainlinkAggregator"
    );
    AppreciatingOracle = await ethers.getContractFactory("AppreciatingOracle");
  });

  before("Deploy contracts", async () => {
    mockChainlinkAggregator = await MockChainlinkAggregator.connect(
      operator
    ).deploy();
    await mockChainlinkAggregator.setPrice(CHAINLINK_PRECISION.mul(2));

    appreciatingOracle = await AppreciatingOracle.connect(operator).deploy(
      "PriceFeed",
      GMU_PRECISION,
      operator.address,
      mockChainlinkAggregator.address
    );
  });

  describe("Fetch the price without any updates", async () => {
    it("Should fetch GMU price correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq(GMU_PRECISION);
    });

    it("Should fetch chainlink feed price correctly", async () => {
      expect(await appreciatingOracle.currFeedPrice()).to.eq(
        GMU_PRECISION.mul(2)
      );
    });
  });
});
