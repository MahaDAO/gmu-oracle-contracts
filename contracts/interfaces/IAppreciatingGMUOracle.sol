// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "./AggregatorV3Interface.sol";

interface IAppreciatingGMUOracle {
  function getPrice() external returns (uint256);

  function getDecimalPercision() external view returns (uint256);

  function updateChainlinkFeed(AggregatorV3Interface feed) external;
}
