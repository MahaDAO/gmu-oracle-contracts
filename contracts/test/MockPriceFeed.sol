// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../interfaces/IPriceFeed.sol";

contract MockPriceFeed is IPriceFeed {
    uint256 private decimalsVal = 18;
    uint256 private price = uint256(10 ** decimalsVal);

    // --- Functions ---

    function setPrice(uint256 _price) external {
        price = _price;
    }

    // --- Getters that adhere to the AggregatorV3 interface ---

    function getDecimalPercision() external view override returns (uint256) {
        return decimalsVal;
    }

    function fetchPrice() external override returns (uint256) {
        emit LastGoodPriceUpdated(price);
        return price;
    }
}
