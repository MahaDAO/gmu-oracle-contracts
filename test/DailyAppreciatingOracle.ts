import chai, { expect } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { Contract, ContractFactory, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { advanceTimeAndBlock } from "./utils";

chai.use(solidity);

describe("DailyAppreciatingOracle", () => {
  let operator: SignerWithAddress;

  const GMU_PRECISION = BigNumber.from(10).pow(18);
  const MA_PRICE_FEED_PRECISION = BigNumber.from(10).pow(18);
  const MAX_PRICE_CHANGE = BigNumber.from(10).pow(18);

  const GMU_STARTING_PRICE = GMU_PRECISION.mul(2);
  const MA_PRICE_FEED_STARTING_PRICE = MA_PRICE_FEED_PRECISION.mul(2000);

  before("Setup accounts", async () => {
    [operator] = await ethers.getSigners();
  });

  let MockPriceFeed: ContractFactory;
  let mock30DPriceFeed: Contract;
  let mock7DPriceFeed: Contract;
  let dailyAppreciatingOracle: Contract;
  let DailyAppreciatingOracle: ContractFactory;

  before("Fetch contract factories", async () => {
    MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    DailyAppreciatingOracle = await ethers.getContractFactory(
      "DailyAppreciatingOracle"
    );
  });

  beforeEach("Deploy contracts", async () => {
    mock7DPriceFeed = await MockPriceFeed.connect(operator).deploy();
    mock30DPriceFeed = await MockPriceFeed.connect(operator).deploy();

    await mock7DPriceFeed.setPrice(MA_PRICE_FEED_STARTING_PRICE);
    await mock30DPriceFeed.setPrice(MA_PRICE_FEED_STARTING_PRICE);

    dailyAppreciatingOracle = await DailyAppreciatingOracle.connect(
      operator
    ).deploy(
      "PriceFeed",
      GMU_STARTING_PRICE,
      mock7DPriceFeed.address,
      mock30DPriceFeed.address,
      MAX_PRICE_CHANGE
    );
  });

  describe("7D & 30D is up after start & price update is called", async () => {
    beforeEach("Update prices- Should emit price update event", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2200)); // Increase by 10% from start.
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2150)); // Increase by 7.5% from start.

      await expect(dailyAppreciatingOracle.fetchPrice())
        .to.emit(dailyAppreciatingOracle, "LastGoodPriceUpdated")
        .withArgs("2150000000000000000");
    });

    it("Should fetch GMU price correctly", async () => {
      // An increase of 7.5% from lastPrice(start in this case).
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2150000000000000000"
      );
    });

    it("Should fetch 30D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2150000000000000000000"
      );
    });

    it("Should fetch 7D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2200000000000000000000"
      );
    });
  });

  describe("7D & 30D is down after start &  price update is called", async () => {
    beforeEach("Update prices- Shouldn't emit price update event", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(1700)); // Decrease by 15% from start.
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(1850)); // Decrease by 7.5% from start.

      await expect(dailyAppreciatingOracle.fetchPrice()).to.not.emit(
        dailyAppreciatingOracle,
        "LastGoodPriceUpdated"
      );
    });

    it("Should fetch GMU price correctly", async () => {
      // No change from lastPrice(start in this case).
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2000000000000000000"
      );
    });

    it("Should fetch 30D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "1850000000000000000000"
      );
    });

    it("Should fetch 7D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "1700000000000000000000"
      );
    });
  });

  describe("7D is up, 30D is down after start & price update is called", async () => {
    beforeEach("Update prices- Shouldn't emit price update event", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2100)); // Increase by 5% from start.
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(1850)); // Decrease by 7.5% from start.

      await expect(dailyAppreciatingOracle.fetchPrice()).to.not.emit(
        dailyAppreciatingOracle,
        "LastGoodPriceUpdated"
      );
    });

    it("Should fetch GMU price correctly", async () => {
      // No change from lastPrice(start in this case).
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2000000000000000000"
      );
    });

    it("Should fetch 30D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "1850000000000000000000"
      );
    });

    it("Should fetch 7D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2100000000000000000000"
      );
    });
  });

  describe("7D is down, 30D is up start & price update is called", async () => {
    beforeEach("Update prices- Shouldn't emit price update event", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(1850)); // Decrease by 7.5% from start.
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2100)); // Increase by 5% from start.

      await expect(dailyAppreciatingOracle.fetchPrice()).to.not.emit(
        dailyAppreciatingOracle,
        "LastGoodPriceUpdated"
      );
    });

    it("Should fetch GMU price correctly", async () => {
      // No change from lastPrice(start in this case).
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2000000000000000000"
      );
    });

    it("Should fetch 30D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2100000000000000000000"
      );
    });

    it("Should fetch 7D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "1850000000000000000000"
      );
    });
  });

  describe("7D & 30D is up after start & price update is called for 2 epochs", async () => {
    it("Should fetch price correctly for the both time", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2200)); // Increase by 10% from start.
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2150)); // Increase by 7.5% from start.

      await expect(dailyAppreciatingOracle.fetchPrice())
        .to.emit(dailyAppreciatingOracle, "LastGoodPriceUpdated")
        .withArgs("2150000000000000000");

      // An increase of 7.5% from lastPrice(start in this case).
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2150000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2150000000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2200000000000000000000"
      );

      await advanceTimeAndBlock(86400);

      // Increase the price again.
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2460));
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2350));

      await expect(dailyAppreciatingOracle.fetchPrice())
        .to.emit(dailyAppreciatingOracle, "LastGoodPriceUpdated")
        .withArgs("2349999999999999999");

      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2349999999999999999"
      );
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2350000000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2460000000000000000000"
      );
    });
  });

  describe("7D & 30D is up for 1 epoch then down & price update is called", async () => {
    it("Should fetch price correctly for the both time", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2200)); // Increase by 10% from start.
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2150)); // Increase by 7.5% from start.

      await expect(dailyAppreciatingOracle.fetchPrice())
        .to.emit(dailyAppreciatingOracle, "LastGoodPriceUpdated")
        .withArgs("2150000000000000000");

      // An increase of 7.5% from lastPrice(start in this case).
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2150000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2150000000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2200000000000000000000"
      );

      await advanceTimeAndBlock(86400);

      // Decrease the price.
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2199));
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2149));

      await expect(dailyAppreciatingOracle.fetchPrice()).to.not.emit(
        dailyAppreciatingOracle,
        "LastGoodPriceUpdated"
      );

      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2150000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2149000000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2199000000000000000000"
      );
    });
  });

  describe("7D & 30D is up for 1 epoch then down and then up again & price update is called", async () => {
    it("Should fetch price correctly for the second up trend is still lower than startPrice", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2200)); // Increase by 10% from start.
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2150)); // Increase by 7.5% from start.

      await expect(dailyAppreciatingOracle.fetchPrice())
        .to.emit(dailyAppreciatingOracle, "LastGoodPriceUpdated")
        .withArgs("2150000000000000000");

      // An increase of 7.5% from lastPrice(start in this case).
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2150000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2150000000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2200000000000000000000"
      );

      await advanceTimeAndBlock(86400);

      // Price goes down for both.
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2149));
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2100));

      await expect(dailyAppreciatingOracle.fetchPrice()).to.not.emit(
        dailyAppreciatingOracle,
        "LastGoodPriceUpdated"
      );

      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2150000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2100000000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2149000000000000000000"
      );

      await advanceTimeAndBlock(86400);

      // Price goes up again but lower than when started.
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2180));
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2140));

      await expect(dailyAppreciatingOracle.fetchPrice())
        .to.emit(dailyAppreciatingOracle, "LastGoodPriceUpdated")
        .withArgs("2190952380952380951");

      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2190952380952380951"
      );
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2140000000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2180000000000000000000"
      );
    });

    it("Should fetch price correctly for the second up trend is greater than startPrice", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2200)); // Increase by 10% from start.
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2150)); // Increase by 7.5% from start.

      await expect(dailyAppreciatingOracle.fetchPrice())
        .to.emit(dailyAppreciatingOracle, "LastGoodPriceUpdated")
        .withArgs("2150000000000000000");

      // An increase of 7.5% from lastPrice(start in this case).
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2150000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2150000000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2200000000000000000000"
      );

      await advanceTimeAndBlock(86400);

      // Price goes down for both.
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2149));
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2100));

      await expect(dailyAppreciatingOracle.fetchPrice()).to.not.emit(
        dailyAppreciatingOracle,
        "LastGoodPriceUpdated"
      );

      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2150000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2100000000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2149000000000000000000"
      );

      await advanceTimeAndBlock(86400);

      // Price goes up again but lower than when started.
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2210));
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2160));

      await expect(dailyAppreciatingOracle.fetchPrice())
        .to.emit(dailyAppreciatingOracle, "LastGoodPriceUpdated")
        .withArgs("2211428571428571427");

      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2211428571428571427"
      );
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2160000000000000000000"
      );
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2210000000000000000000"
      );
    });
  });

  describe("Fetch the price without any updates", async () => {
    it("Should fetch GMU price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2000000000000000000"
      );
    });

    it("Should fetch 30D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2000000000000000000000"
      );
    });

    it("Should fetch 7D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2000000000000000000000"
      );
    });
  });

  describe("30D & 7D is down after start & price update is not called", async () => {
    beforeEach("Set prices", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(1500));
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(1700));
    });

    it("Should fetch GMU price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2000000000000000000"
      );
    });

    it("Should fetch 30D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2000000000000000000000"
      );
    });

    it("Should fetch 7D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2000000000000000000000"
      );
    });
  });

  describe("30D & 7D is up after start & price update is not called", async () => {
    beforeEach("Set prices", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2500));
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2800));
    });

    it("Should fetch GMU price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2000000000000000000"
      );
    });

    it("Should fetch 30D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2000000000000000000000"
      );
    });

    it("Should fetch 7D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2000000000000000000000"
      );
    });
  });

  describe("7D is down, 30D is up after start & price update is not called", async () => {
    beforeEach("Set prices", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(1500));
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2500));
    });

    it("Should fetch GMU price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2000000000000000000"
      );
    });

    it("Should fetch 30D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2000000000000000000000"
      );
    });

    it("Should fetch 7D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2000000000000000000000"
      );
    });
  });

  describe("7D is up, 30D is down after start & price update is not called", async () => {
    beforeEach("Set prices", async () => {
      await mock7DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(2500));
      await mock30DPriceFeed.setPrice(MA_PRICE_FEED_PRECISION.mul(1500));
    });

    it("Should fetch GMU price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice()).to.eq(
        "2000000000000000000"
      );
    });

    it("Should fetch 30D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice30d()).to.eq(
        "2000000000000000000000"
      );
    });

    it("Should fetch 7D price correctly", async () => {
      expect(await dailyAppreciatingOracle.lastPrice7d()).to.eq(
        "2000000000000000000000"
      );
    });
  });
});
