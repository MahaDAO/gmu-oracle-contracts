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
      expect(await appreciatingOracle.currPrice()).to.eq("2000000");
    });

    it("Should fetch chainlink feed price correctly", async () => {
      expect(await appreciatingOracle.currFeedPrice()).to.eq("2000000");
    });
  });

  describe("Fetch the price when market is down after start but price update is not called", async () => {
    beforeEach("Set chainlink oracle price to 1.5", async () => {
      await mockChainlinkAggregator.setPrice("150000000"); // Decrease in price by 0.5 cents from starting price.
    });

    it("Should fetch starting GMU price correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq("2000000");
    });

    it("Should fetch starting chainlink feed price correctly", async () => {
      expect(await appreciatingOracle.currFeedPrice()).to.eq("2000000");
    });
  });

  describe("Fetch the price when market is up after start but price update is not called", async () => {
    beforeEach("Set chainlink oracle price to 2.5", async () => {
      await mockChainlinkAggregator.setPrice("250000000"); // Increase in price by 0.5 cents from starting price.
    });

    it("Should fetch starting GMU price correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq("2000000");
    });

    it("Should fetch starting chainlink feed price correctly", async () => {
      expect(await appreciatingOracle.currFeedPrice()).to.eq("2000000");
    });
  });

  describe("Fetch the price when market is down after start but price update is called", async () => {
    beforeEach("Set chainlink oracle price to 1.5", async () => {
      await mockChainlinkAggregator.setPrice("150000000"); // Decrease in price by 0.5 cents from starting price.

      await expect(appreciatingOracle.getPrice())
        .to.emit(appreciatingOracle, "ChainklinkFeedPriceChange")
        .withArgs("2000000", "1500000")
        .to.not.emit(appreciatingOracle, "PriceChange");
    });

    it("Should fetch starting GMU price correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq("2000000");
    });

    it("Should fetch starting chainlink feed price correctly", async () => {
      expect(await appreciatingOracle.currFeedPrice()).to.eq("1500000");
    });
  });

  describe("Fetch the price when market is up after start but price update is called", async () => {
    beforeEach("Set chainlink oracle price to 2.5", async () => {
      await mockChainlinkAggregator.setPrice("250000000"); // Increase in price by 0.5 cents from starting price.

      await expect(appreciatingOracle.getPrice())
        .to.emit(appreciatingOracle, "ChainklinkFeedPriceChange")
        .withArgs("2000000", "2500000")
        .to.emit(appreciatingOracle, "PriceChange")
        .withArgs("2000000", "2500000");
    });

    it("Should fetch starting GMU price correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq("2500000");
    });

    it("Should fetch starting chainlink feed price correctly", async () => {
      expect(await appreciatingOracle.currFeedPrice()).to.eq("2500000");
    });
  });

  describe("Fetch the price when market is up then down and again up", async () => {
    beforeEach("Set chainlink oracle price to 2.5", async () => {
      await mockChainlinkAggregator.setPrice("250000000"); // Increase in price by 0.5 cents from starting price.

      await expect(appreciatingOracle.getPrice())
        .to.emit(appreciatingOracle, "ChainklinkFeedPriceChange")
        .withArgs("2000000", "2500000")
        .to.emit(appreciatingOracle, "PriceChange")
        .withArgs("2000000", "2500000");
    });

    it("Should work correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq("2500000");
      expect(await appreciatingOracle.currFeedPrice()).to.eq("2500000");

      await mockChainlinkAggregator.setPrice("200000000"); // Decrease in price by 0.5 cents from last price.
      await expect(appreciatingOracle.getPrice())
        .to.emit(appreciatingOracle, "ChainklinkFeedPriceChange")
        .withArgs("2500000", "2000000")
        .to.not.emit(appreciatingOracle, "PriceChange");

      expect(await appreciatingOracle.currPrice()).to.eq("2500000"); // This remains the same when last up trend was there.
      expect(await appreciatingOracle.currFeedPrice()).to.eq("2000000"); // This changes to latest market trend.

      await mockChainlinkAggregator.setPrice("300000000"); // Incrase the price by 1$ from the last price.
      await expect(appreciatingOracle.getPrice())
        .to.emit(appreciatingOracle, "ChainklinkFeedPriceChange")
        .withArgs("2000000", "3000000")
        .to.emit(appreciatingOracle, "PriceChange")
        .withArgs("2500000", "3750000");

      expect(await appreciatingOracle.currPrice()).to.eq("3750000");
      expect(await appreciatingOracle.currFeedPrice()).to.eq("3000000");
    });
  });

  describe("Fetch the price when market is down then up and again up", async () => {
    beforeEach("Set chainlink oracle price to 1.5", async () => {
      await mockChainlinkAggregator.setPrice("150000000"); // Increase in price by 0.5 cents from starting price.

      await expect(appreciatingOracle.getPrice())
        .to.emit(appreciatingOracle, "ChainklinkFeedPriceChange")
        .withArgs("2000000", "1500000")
        .to.not.emit(appreciatingOracle, "PriceChange");
    });

    it("Should work correctly", async () => {
      expect(await appreciatingOracle.currPrice()).to.eq("2000000");
      expect(await appreciatingOracle.currFeedPrice()).to.eq("1500000");

      await mockChainlinkAggregator.setPrice("200000000"); // Decrease in price by 0.5 cents from last price.
      await expect(appreciatingOracle.getPrice())
        .to.emit(appreciatingOracle, "ChainklinkFeedPriceChange")
        .withArgs("1500000", "2000000")
        .to.emit(appreciatingOracle, "PriceChange")
        .withArgs("2000000", "2666666");

      expect(await appreciatingOracle.currPrice()).to.eq("2666666"); // This increases as there is an increase in price.
      expect(await appreciatingOracle.currFeedPrice()).to.eq("2000000"); // This changes to latest market trend.

      await mockChainlinkAggregator.setPrice("300000000"); // Incrase the price by 1$ from the last price.
      await expect(appreciatingOracle.getPrice())
        .to.emit(appreciatingOracle, "ChainklinkFeedPriceChange")
        .withArgs("2000000", "3000000")
        .to.emit(appreciatingOracle, "PriceChange")
        .withArgs("2666666", "3999999");

      expect(await appreciatingOracle.currPrice()).to.eq("3999999");
      expect(await appreciatingOracle.currFeedPrice()).to.eq("3000000");
    });
  });
});
