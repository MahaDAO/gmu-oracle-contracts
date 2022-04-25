//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAppreciatingOracle} from "./interfaces/IAppreciatingOracle.sol";

/**
 * An always appreciating price feed. Cruicial because the GMU peg needs to always continue to
 * appreciate. This oracle appreciates the price across a certain period of time.
 *
 * Price updates should be recieved from another contract which calculates and
 * understands by how much should the price be updated by.
 *
 * @author Steven Enamakel enamakel@mahadao.com
 */
contract AppreciatingOracle is Ownable, IAppreciatingOracle {
  using SafeMath for uint256;

  uint256 public precision = 1e9; // 100% in 1e6
  uint256 public maxPriceChange; // ideally should be 1-10% in 1e6

  uint256 public priceNext = 1e6;
  uint256 public pricePrev = 1e6;

  string public name;

  event PriceChange(uint256 timestamp, uint256 nextPrice);

  constructor(
    string memory _name,
    uint256 startingPrice,
    address _governance
  ) {
    name = _name;
    priceNext = startingPrice;
    pricePrev = startingPrice;
    _transferOwnership(_governance);
  }

  function getPrice() public view override returns (uint256) {
    return pricePrev.add(priceNext).div(2); // todo need to make this time based
  }

  function getDecimalPercision() public pure override returns (uint256) {
    return 6;
  }

  // TODO: need to rewrite the get price function

  function setPrice(uint256 _price) external override onlyOwner {
    require(
      _price > priceNext,
      "AppreciatingPrice: new price not greater than current price"
    );
    pricePrev = priceNext;
    priceNext = _price;

    // todo need to accomadate increaes dynamically of sorts...

    _checkMaxPriceChange(priceNext, pricePrev);

    emit PriceChange(block.timestamp, _price);
  }

  function _checkMaxPriceChange(uint256 priceA, uint256 priceB) internal view {
    uint256 minPrice = Math.min(priceA, priceB);
    uint256 maxPrice = Math.max(priceA, priceB);
    uint256 priceChange = maxPrice.sub(minPrice).mul(precision).mul(100).div(
      maxPrice
    );

    require(
      priceChange < maxPriceChange,
      "AppreciatingOracle: too much price deviation"
    );
  }
}
