//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {FixedPrice} from "./FixedPrice.sol";

/**
 * A always appreciating price feed. Cruicial because the GMU peg needs to always continue to
 * appreciate. This oracle appreciates the price across a certain period of time.
 */
contract AppreciatingPrice is FixedPrice {
  constructor(
    string memory _name,
    uint256 startingPrice,
    address _governance
  ) FixedPrice(_name, startingPrice, _governance) {
    // nothing here
  }

  function setPrice(uint256 _price) public override onlyOwner {
    require(
      _price > price,
      "AppreciatingPrice: new price not greater than current price"
    );
    super.setPrice(_price);
  }
}
