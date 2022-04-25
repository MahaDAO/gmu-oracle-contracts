//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IOracle} from "./interfaces/IOracle.sol";
import {ITroveManager} from "./interfaces/ITroveManager.sol";
import {IGovernance} from "./interfaces/IGovernance.sol";
import {Epoch} from "./utils/Epoch.sol";

/**
 * An index which is of all the CR of all the troves combined.
 */
contract TrovesCRIndex is Ownable, Epoch, IOracle {
  using SafeMath for uint256;

  struct Trove {
    ITroveManager manager;
    IGovernance governance;
  }

  uint256 public troveCount;
  mapping(uint256 => Trove) public troves;
  uint256 private _priceCache;

  constructor(
    Trove[] memory _troves,
    address _governance,
    uint256 period
  ) Epoch(period, block.timestamp, 0) {
    for (uint256 index = 0; index < _troves.length; index++) {
      troves[index] = _troves[index];
      index++;
    }

    // todo: need to make this flashloan resistant
    require(false, "not yet flashloan resistant");

    _transferOwnership(_governance);
  }

  function addTrove(ITroveManager trove, IGovernance gov) public onlyOwner {
    troves[troveCount] = Trove({manager: trove, governance: gov});
  }

  function getPrice() public view override returns (uint256) {
    return _priceCache;
  }

  function updatePrice() public checkEpoch {
    _priceCache = calculatePrice();
  }

  function calculatePrice() public view returns (uint256) {
    uint256 collat;
    uint256 debt;

    for (uint256 i = 0; i < troveCount; i++) {
      Trove memory trove = troves[i];

      uint256 tmCollat = trove.manager.getTCR(
        trove.governance.getPriceFeed().fetchPrice()
      );

      // These variables are flashloan manipulatable. An attacker can simply deposit a large
      // amount of ETH for example and make the TCR go insanely high. This causes the
      // GMU peg to appreciate by a lot which can cause serious liquidations if not taken
      // care of properly.
      //
      // Ideally this oracle should be placed behind a 30 day daily TWAP.

      debt = trove.manager.getEntireSystemDebt();
      collat = collat.add(tmCollat);
    }

    return collat.mul(1e18).div(debt);
  }

  function getDecimalPercision() public pure override returns (uint256) {
    return 18;
  }
}
