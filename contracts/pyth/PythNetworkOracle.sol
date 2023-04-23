// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";

interface IPyth {
    function getPrice(bytes32 id) external view returns (Price memory price);

    function updatePriceFeeds(bytes[] calldata updateData) external payable;

    function getUpdateFee(
        bytes[] calldata updateData
    ) external view returns (uint feeAmount);

    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint publishTime;
    }
}

contract PythNetworkOracle is AggregatorV3Interface {
    IPyth public pyth;
    bytes32 public priceID;
    uint8 public override decimals;
    string public symbol;

    constructor(
        address _pyth,
        string memory _symbol,
        bytes32 _priceID,
        uint8 _decimals
    ) {
        pyth = IPyth(_pyth);
        symbol = _symbol;
        priceID = _priceID;
        decimals = _decimals;
    }

    function fetchPrice() external view returns (int256) {
        return _fetchPrice();
    }

    function _fetchPrice() internal view returns (int256) {
        IPyth.Price memory res = pyth.getPrice(priceID);
        return res.price;
    }

    function description() external pure override returns (string memory) {
        return "A chainlink port for pyth network.";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(
        uint80 _roundId
    )
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
        return (_roundId, _fetchPrice(), 0, block.timestamp, _roundId);
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
        return (1, _fetchPrice(), 0, block.timestamp, 1);
    }

    function latestAnswer() external view override returns (int256) {
        return _fetchPrice();
    }

    function latestTimestamp() external view override returns (uint256) {
        return block.timestamp;
    }

    function latestRound() external view override returns (uint256) {
        return block.timestamp;
    }

    function getAnswer(uint256) external view override returns (int256) {
        return _fetchPrice();
    }

    function getTimestamp(uint256) external view override returns (uint256) {
        return block.timestamp;
    }

    function updatePythPrice(bytes[] calldata pythUpdateData) external {
        uint updateFee = pyth.getUpdateFee(pythUpdateData);
        pyth.updatePriceFeeds{value: updateFee}(pythUpdateData);
    }
}
