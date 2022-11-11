//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {IARTHPriceFeed} from "./interfaces/IARTHPriceFeed.sol";

contract PriceFeedWrapper is AggregatorV3Interface {
    string public constant NAME = "ARTH Pricefeed Wrapper";

    IARTHPriceFeed public priceFeed;

    constructor(
        IARTHPriceFeed _priceFeed
    ) {
        priceFeed = _priceFeed;
    }

    function decimals() external view override returns (uint8) {
        return uint8(priceFeed.TARGET_DIGITS());
    }

    function description() external pure override returns (string memory) {
        return "ARTH GMU Oracle Wrapper for AggregatorV3Interface";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 _roundId)
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
        return (
            _roundId,
            int256(priceFeed.lastGoodPrice()),
            block.timestamp,
            block.timestamp,
            _roundId
        );
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
        return (
            1,
            int256(priceFeed.lastGoodPrice()),
            block.timestamp,
            block.timestamp,
            1
        );
    }
}
