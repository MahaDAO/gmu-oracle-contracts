//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FixedPrice} from "./FixedPrice.sol";

contract GMUOracle is FixedPrice {
  constructor(uint256 startingPrice, address _governance)
    FixedPrice("GMU/USD Oracle", startingPrice, _governance)
  {
    // do nothing
  }
}
