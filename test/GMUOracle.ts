import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

describe("GMUOracle", async function () {
  const { provider } = ethers;

  const one = BigNumber.from(10).pow(18);

  let dummyOracle: Contract;
  let gmuOracle: Contract;

  beforeEach(async function () {
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const GMUOracle = await ethers.getContractFactory("GMUOracle");

    dummyOracle = await MockOracle.deploy(one.mul(130));
    gmuOracle = await GMUOracle.deploy(
      one.mul(2),
      dummyOracle.address,
      [100, 110, 120].map((p) => one.mul(p))
    );
  });

  it("Should deploy properly", async function () {
    expect(await gmuOracle.oracle()).to.be.equal(dummyOracle.address);
    expect(await gmuOracle.getPeriod()).to.be.equal(86400);
    // expect(await GMUOracle.fetchPrice()).to.be.equal("200000000000000000000");
  });

  describe("test the basics", async function () {
    describe("pass one epoch with no price change", async function () {
      beforeEach(async function () {
        await provider.send("evm_increaseTime", [3600]);
        await gmuOracle.updatePrice();
      });

      it("Should report price properly", async function () {
        expect(await gmuOracle.fetchPrice()).to.be.equal(
          "120000000000000000000"
        );
      });
    });
    // todo
  });

  describe("test the TWAP values", async function () {
    // todo
  });

  describe("test the price scaling features", async function () {
    // todo
  });

  describe("test the algorithimic calculations", async function () {
    // todo
  });

  describe("test the failsafe", async function () {
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
