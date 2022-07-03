import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

describe("LinearAppreciatingOracle", async function () {
  const { provider } = ethers;
  const one = BigNumber.from(10).pow(18);

  let oracle: Contract;

  beforeEach(async function () {
    const LinearAppreciatingOracle = await ethers.getContractFactory(
      "LinearAppreciatingOracle"
    );

    oracle = await LinearAppreciatingOracle.deploy(
      "Test LinearAppreciatingOracle",
      one
    );
  });

  it("Should deploy properly", async function () {
    expect(await oracle.fetchPrice()).to.be.equal(one);
    expect(await oracle.startPrice()).to.be.equal(one);
    expect(await oracle.endPrice()).to.be.equal(one);
  });

  describe("notify new price once for a duration of 1 day ", async function () {
    let now: number;
    let startPrice: number;

    beforeEach(async function () {
      expect(await oracle.fetchPrice()).to.be.equal(one);
      now = Number(await oracle.timestamp());

      await oracle.notifyNewPrice(one.mul(2), 86400);

      now = Number(await oracle.timestamp());
      startPrice = await oracle.startPrice();
      expect(await oracle.endPrice()).to.be.equal(one.mul(2));
    });

    it("Should report price properly at hour 0", async function () {
      expect(await oracle.fetchPriceAt(now)).to.be.equal(startPrice);
    });

    it("Should report price properly at hour 6", async function () {
      expect(await oracle.fetchPriceAt(now + 21600)).to.be.equal(
        one.mul(125).div(100)
      );
    });

    it("Should report price properly at hour 12", async function () {
      expect(await oracle.fetchPriceAt(now + 43200)).to.be.equal(
        one.mul(15).div(10)
      );
    });

    it("Should report price properly at hour 24", async function () {
      expect(await oracle.fetchPriceAt(now + 86400)).to.be.equal(one.mul(2));
    });

    it("Should report price properly at hour 48", async function () {
      expect(await oracle.fetchPriceAt(now + 172800)).to.be.equal(one.mul(2));
    });

    describe("notify new price again after 12 hours in the same day for a duration of 1 day ", async function () {
      beforeEach(async function () {
        await provider.send("evm_increaseTime", [43200]);
        await oracle.notifyNewPrice(one.mul(4), 86400);

        now = Number(await oracle.timestamp());
        startPrice = await oracle.startPrice();

        expect(await oracle.endPriceTime()).to.be.equal(now + 86400);
        expect(await oracle.endPrice()).to.be.equal(one.mul(4));
      });

      it("Should report price properly at hour 12", async function () {
        expect(await oracle.fetchPriceAt(now)).to.be.equal(startPrice);
      });

      it("Should report price properly at hour 18", async function () {
        expect(
          (await oracle.fetchPriceAt(now + 21600)).mul(100).div(one)
        ).to.be.equal(212);
      });

      it("Should report price properly at hour 24", async function () {
        expect(
          (await oracle.fetchPriceAt(now + 43200)).mul(100).div(one)
        ).to.be.equal(275);
      });

      it("Should report price properly at hour 36", async function () {
        expect(
          (await oracle.fetchPriceAt(now + 64800)).mul(100).div(one)
        ).to.be.equal(337);
      });

      it("Should report price properly at hour 48", async function () {
        expect(
          (await oracle.fetchPriceAt(now + 172800)).mul(100).div(one)
        ).to.be.equal(400);
      });

      it("Should report price properly at hour 60", async function () {
        expect(
          (await oracle.fetchPriceAt(now + 216000)).mul(100).div(one)
        ).to.be.equal(400);
      });
    });
  });
});
