//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IOracle} from "./interfaces/IOracle.sol";

/**
 * A always appreciating price feed. Cruicial because the GMU peg needs to always continue to
 * appreciate. This oracle appreciates the price across a certain period of time.
 */
contract AppreciatingPrice is Ownable, IOracle {
  using SafeMath for uint256;

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

  function setPrice(uint256 _price) public onlyOwner {
    require(
      _price > priceNext,
      "AppreciatingPrice: new price not greater than current price"
    );
    pricePrev = priceNext;
    priceNext = _price;

    // todo need to accomadate increaes dynamically of sorts...

    emit PriceChange(block.timestamp, _price);
  }
}
