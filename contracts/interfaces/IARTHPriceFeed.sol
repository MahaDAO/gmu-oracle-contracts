//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {IPriceFeed} from "./IPriceFeed.sol";

interface IARTHPriceFeed is IPriceFeed {
    function lastGoodPrice() external view returns (uint256);

    function TARGET_DIGITS() external view returns (uint256);
}
