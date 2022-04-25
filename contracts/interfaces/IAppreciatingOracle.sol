// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IOracle} from "./IOracle.sol";

interface IAppreciatingOracle is IOracle {
  function setPrice(uint256 price) external;
}
