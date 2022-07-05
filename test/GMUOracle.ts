import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { IData, readCSV } from "./utils";

describe("GMUOracle", async function () {
  const { provider } = ethers;

  const one = BigNumber.from(10).pow(18);

  console.log("hit");

  let data: IData[];
  let dummyOracle: Contract;
  let gmuOracle: Contract;

  const to18BN = (n: number) => one.mul(Math.floor(n * 1000)).div(1000);

  const expectRoughly = (ret: BigNumber, exp: number) =>
    expect(ret.mul(10).div(one)).to.be.equal(Math.floor(exp * 10));

  beforeEach(async function () {
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const GMUOracle = await ethers.getContractFactory("GMUOracle");

    data = await readCSV("gmu_sample.csv");

    const first30daysPrice = data
      .filter((_v, i) => i < 30)
      .map((p) => to18BN(p.price));

    dummyOracle = await MockOracle.deploy(to18BN(data[31].price));
    gmuOracle = await GMUOracle.deploy(
      one.mul(2),
      dummyOracle.address,
      first30daysPrice
    );
  });

  it("Should deploy properly", async function () {
    expect(await gmuOracle.oracle()).to.be.equal(dummyOracle.address);
    expect(await gmuOracle.getPeriod()).to.be.equal(86400);
    expect(await gmuOracle.fetchLastGoodPrice()).to.be.equal(one.mul(2));
    expectRoughly(await gmuOracle.lastPrice30d(), data[29].average30D);
    expectRoughly(await gmuOracle.lastPrice7d(), data[29].average7D);
    expect(await gmuOracle.broken()).to.be.equal(false);
  });

  describe("pass one epoch with no price change but twap changes", async function () {
    beforeEach(async function () {
      await provider.send("evm_increaseTime", [86400]);
      await dummyOracle.setPrice(to18BN(data[31].price));
    });

    it("Should emit an epoch", async function () {
      await expect(gmuOracle.updatePrice()).to.emit(
        gmuOracle,
        "EpochTriggered"
      );
    });

    it("Should report price properly", async function () {
      await gmuOracle.updatePrice();
      expect(await gmuOracle.fetchLastGoodPrice()).to.be.equal(one.mul(2));
    });

    it("Should update 30d TWAP properly", async function () {
      const priceBefore = await gmuOracle.lastPrice30d();
      await gmuOracle.updatePrice();
      expectRoughly(await gmuOracle.lastPrice30d(), 184.195);
      expect(await gmuOracle.lastPrice30d()).to.not.be.equal(priceBefore);
    });

    it("Should update 7d TWAP properly", async function () {
      const priceBefore = await gmuOracle.lastPrice7d();
      await gmuOracle.updatePrice();
      expectRoughly(await gmuOracle.lastPrice7d(), 247.9);
      expect(await gmuOracle.lastPrice7d()).to.not.be.equal(priceBefore);
    });
  });

  describe("pass through 10 epochs in the simulation", async function () {
    beforeEach(async function () {
      for (let index = 0; index < 10; index++) {
        await dummyOracle.setPrice(to18BN(data[index + 31].price));
        await gmuOracle.updatePrice();
        await provider.send("evm_increaseTime", [86400]);
      }
    });

    it("Should change the price", async function () {
      expectRoughly(await gmuOracle.fetchLastGoodPrice(), 2.03);
    });

    it("Should update 30d TWAP properly", async function () {
      const priceBefore = await gmuOracle.lastPrice30d();
      await gmuOracle.updatePrice();
      expectRoughly(await gmuOracle.lastPrice30d(), 226.8);
      expect(await gmuOracle.lastPrice30d()).to.not.be.equal(priceBefore);
    });

    it("Should update 7d TWAP properly", async function () {
      const priceBefore = await gmuOracle.lastPrice7d();
      await gmuOracle.updatePrice();
      expectRoughly(await gmuOracle.lastPrice7d(), 267.7);
      expect(await gmuOracle.lastPrice7d()).to.not.be.equal(priceBefore);
    });
  });

  describe.skip("test the price scaling features", async function () {
    // todo
  });

  describe.skip("test the algorithimic calculations", async function () {
    // todo
  });

  describe.skip("test the failsafe", async function () {
    // todo
    describe("fail one epoch with a large price change", async function () {
      beforeEach(async function () {
        await provider.send("evm_increaseTime", [3600]);
        await dummyOracle.setPrice(one.mul(100000));
      });

      it("Should revert", async function () {
        await gmuOracle.updatePrice();
        await expect(gmuOracle.fetchPrice()).to.be.revertedWith(
          "GMUOracle: oracle is broken"
        );
      });
    });

    describe("pass one epoch with a small price change", async function () {
      beforeEach(async function () {
        // expect(await GMUOracle.fetchPrice()).to.be.equal("1000000000000000000");

        await provider.send("evm_increaseTime", [3600]);
        await dummyOracle.setPrice(one.mul(150));
        await gmuOracle.updatePrice();
      });

      it("Should report price properly", async function () {
        expect(await gmuOracle.fetchPrice()).to.be.equal(
          "126666666666666666666"
        );
      });
    });

    describe("pass two epochs with a small price change", async function () {
      beforeEach(async function () {
        await provider.send("evm_increaseTime", [3600]);
        await dummyOracle.setPrice(one.mul(150));
        await gmuOracle.updatePrice();

        expect(await gmuOracle.fetchPrice()).to.be.equal(
          "126666666666666666666"
        );

        await provider.send("evm_increaseTime", [86400]);
        await dummyOracle.setPrice(one.mul(160));
        await gmuOracle.updatePrice();
      });

      it("Should report price properly", async function () {
        expect(await gmuOracle.fetchPrice()).to.be.equal(
          "143333333333333333333"
        );
      });
    });
  });
});
