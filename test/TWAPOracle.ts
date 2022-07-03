import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

describe("TWAPOracle", async function () {
  const { provider } = ethers;

  const one = BigNumber.from(10).pow(18);

  let dummyOracle: Contract;
  let twapOracle: Contract;

  beforeEach(async function () {
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const TWAPOracle = await ethers.getContractFactory("TWAPOracle");

    dummyOracle = await MockOracle.deploy(one.mul(130));
    twapOracle = await TWAPOracle.deploy(
      "Test TWAP Oracle",
      dummyOracle.address,
      [100, 110, 120].map((p) => one.mul(p)),
      86400,
      3,
      one.mul(50).div(100) // max 50% in one day
    );
  });

  it("Should deploy properly", async function () {
    expect(await twapOracle.oracle()).to.be.equal(dummyOracle.address);
    expect(await twapOracle.getPeriod()).to.be.equal(86400);
    // expect(await twapOracle.fetchPrice()).to.be.equal("200000000000000000000");
  });

  describe("pass one epoch with no price change", async function () {
    beforeEach(async function () {
      await provider.send("evm_increaseTime", [3600]);
      await twapOracle.updatePrice();
    });

    it("Should report price properly", async function () {
      expect(await twapOracle.fetchPrice()).to.be.equal(
        "120000000000000000000"
      );
    });
  });

  describe("fail one epoch with a large price change", async function () {
    beforeEach(async function () {
      await provider.send("evm_increaseTime", [3600]);
      await dummyOracle.setPrice(one.mul(100000));
    });

    it("Should revert", async function () {
      await twapOracle.updatePrice();
      await expect(twapOracle.fetchPrice()).to.be.revertedWith(
        "TWAPOracle: oracle is broken"
      );
    });
  });

  describe("pass one epoch with a small price change", async function () {
    beforeEach(async function () {
      // expect(await twapOracle.fetchPrice()).to.be.equal("1000000000000000000");

      await provider.send("evm_increaseTime", [3600]);
      await dummyOracle.setPrice(one.mul(150));
      await twapOracle.updatePrice();
    });

    it("Should report price properly", async function () {
      expect(await twapOracle.fetchPrice()).to.be.equal(
        "126666666666666666666"
      );
    });
  });

  describe("pass two epochs with a small price change", async function () {
    beforeEach(async function () {
      await provider.send("evm_increaseTime", [3600]);
      await dummyOracle.setPrice(one.mul(150));
      await twapOracle.updatePrice();

      expect(await twapOracle.fetchPrice()).to.be.equal(
        "126666666666666666666"
      );

      await provider.send("evm_increaseTime", [86400]);
      await dummyOracle.setPrice(one.mul(160));
      await twapOracle.updatePrice();
    });

    it("Should report price properly", async function () {
      expect(await twapOracle.fetchPrice()).to.be.equal(
        "143333333333333333333"
      );
    });
  });
});
