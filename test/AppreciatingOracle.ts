import chai, { expect } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { Contract, ContractFactory, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

chai.use(solidity);

describe("Appreciating Oracle", () => {
  const GMU_PRECISION = BigNumber.from(10).pow(6);
  const CHAINLINK_PRECISION = BigNumber.from(10).pow(8);

  const GMU_STARTING_PRICE = GMU_PRECISION.mul(2);
  const CHAINLINK_STARTING_PRICE = CHAINLINK_PRECISION.mul(2);

  let operator: SignerWithAddress;

  before("Setup accounts", async () => {
    [operator] = await ethers.getSigners();
  });

  let appreciatingOracle: Contract;
  let mockChainlinkAggregator: Contract;
  let AppreciatingOracle: ContractFactory;
  let MockChainlinkAggregator: ContractFactory;

  before("Fetch contract factories", async () => {
    MockChainlinkAggregator = await ethers.getContractFactory(
      "MockChainlinkAggregator"
    );
    AppreciatingOracle = await ethers.getContractFactory("AppreciatingOracle");
  });

  beforeEach("Deploy contracts", async () => {
    mockChainlinkAggregator = await MockChainlinkAggregator.connect(
      operator
    ).deploy();
    await mockChainlinkAggregator.setPrice(CHAINLINK_STARTING_PRICE);

    appreciatingOracle = await AppreciatingOracle.connect(operator).deploy(
      "PriceFeed",
      GMU_STARTING_PRICE,
      operator.address,
      mockChainlinkAggregator.address
    );
  });

  describe("Fetch the price without any updates", async () => {
    it("Should fetch GMU price correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq(GMU_STARTING_PRICE);
    });

    it("Should fetch chainlink feed price correctly", async () => {
      expect(await appreciatingOracle.currFeedPrice()).to.eq(
        CHAINLINK_STARTING_PRICE.div(100)
      );
    });
  });

  describe("Fetch the price when market is down after start but price update is not called", async () => {
    beforeEach("Set chainlink oracle price to 1.5", async () => {
      await mockChainlinkAggregator.setPrice(
        CHAINLINK_PRECISION.mul(15).div(10) // 1.5 times CHAINLINK_PRECISION
      );
    });

    it("Should fetch starting GMU price correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq(GMU_STARTING_PRICE);
    });

    it("Should fetch starting chainlink feed price correctly", async () => {
      expect(await appreciatingOracle.currFeedPrice()).to.eq(
        CHAINLINK_STARTING_PRICE.div(100)
      );
    });
  });

  describe("Fetch the price when market is up after start but price update is not called", async () => {
    beforeEach("Set chainlink oracle price to 2.5", async () => {
      await mockChainlinkAggregator.setPrice(
        CHAINLINK_PRECISION.mul(25).div(10) // 2.5 times CHAINLINK_PRECISION
      );
    });

    it("Should fetch starting GMU price correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq(GMU_STARTING_PRICE);
    });

    it("Should fetch starting chainlink feed price correctly", async () => {
      expect(await appreciatingOracle.currFeedPrice()).to.eq(
        CHAINLINK_STARTING_PRICE.div(100)
      );
    });
  });

  describe("Fetch the price when market is down after start but price update is called", async () => {
    beforeEach("Set chainlink oracle price to 1.5", async () => {
      await mockChainlinkAggregator.setPrice(
        CHAINLINK_PRECISION.mul(15).div(10) // 1.5 times CHAINLINK_PRECISION
      );

      await expect(appreciatingOracle.getPrice())
        .to.emit(appreciatingOracle, "ChainklinkFeedPriceChange")
        .withArgs(GMU_PRECISION.mul(2), GMU_PRECISION.mul(15).div(10));
    });

    it("Should fetch starting GMU price correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq(GMU_STARTING_PRICE);
    });

    it("Should fetch starting chainlink feed price correctly", async () => {
      expect(await appreciatingOracle.currFeedPrice()).to.eq(
        CHAINLINK_PRECISION.mul(15).div(10).div(100)
      );
    });
  });
});
