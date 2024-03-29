// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../interfaces/AggregatorV3Interface.sol";

abstract contract MockChainlinkAggregator is AggregatorV3Interface {
    // storage variables to hold the mock data
    uint8 private decimalsVal = 8;
    int256 private price = int256(10**decimalsVal);
    int256 private prevPrice = int256(10**decimalsVal);
    uint256 private updateTime = block.timestamp;
    uint256 private prevUpdateTime = block.timestamp;

    uint80 private latestRoundId = 1;
    uint80 private prevRoundId = 0;

    bool latestRevert;
    bool prevRevert;
    bool decimalsRevert;

    // --- Functions ---

    function setDecimals(uint8 _decimals) external {
        decimalsVal = _decimals;
    }

    function setPrice(int256 _price) external {
        price = _price;
    }

    function setPrevPrice(int256 _prevPrice) external {
        prevPrice = _prevPrice;
    }

    function setPrevUpdateTime(uint256 _prevUpdateTime) external {
        prevUpdateTime = _prevUpdateTime;
    }

    function setUpdateTime(uint256 _updateTime) external {
        updateTime = _updateTime;
    }

    function setLatestRevert() external {
        latestRevert = !latestRevert;
    }

    function setPrevRevert() external {
        prevRevert = !prevRevert;
    }

    function setDecimalsRevert() external {
        decimalsRevert = !decimalsRevert;
    }

    function setLatestRoundId(uint80 _latestRoundId) external {
        latestRoundId = _latestRoundId;
    }

    function setPrevRoundId(uint80 _prevRoundId) external {
        prevRoundId = _prevRoundId;
    }

    // --- Getters that adhere to the AggregatorV3 interface ---

    function decimals() external view override returns (uint8) {
        if (decimalsRevert) {
            require(1 == 0, "decimals reverted");
        }

        return decimalsVal;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        if (latestRevert) {
            require(1 == 0, "latestRoundData reverted");
        }

        return (latestRoundId, price, 0, updateTime, 0);
    }

    function getRoundData(uint80)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        if (prevRevert) {
            require(1 == 0, "getRoundData reverted");
        }

        return (prevRoundId, prevPrice, 0, updateTime, 0);
    }

    function description() external pure override returns (string memory) {
        return "";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }
}
