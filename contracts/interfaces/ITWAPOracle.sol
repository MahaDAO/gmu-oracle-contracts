// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IEpoch} from "./IEpoch.sol";
import {IPriceFeed} from "./IPriceFeed.sol";

interface ITWAPOracle is IEpoch, IPriceFeed {
  event UpdatePriceFeed(address indexed who, address oracle, uint256 price);

  function updatePrice() external;
}
