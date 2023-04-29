// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {ICurvePool} from "../interfaces/ICurvePool.sol";
import {IERC20WithDeciamls} from "../interfaces/IERC20WithDeciamls.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {GmuMath} from "../utils/GmuMath.sol";

contract ChainlinkUniswapLPOracle is AggregatorV3Interface {
    using SafeMath for uint256;
    using GmuMath for uint256;

    ICurvePool public pool;

    AggregatorV3Interface[] public oracles;
    IERC20WithDeciamls[] public tokens;

    uint256 public constant maxDelayTime = 3600; // 1hr update
    uint256 public constant TARGET_DIGITS = 8;

    constructor(
        AggregatorV3Interface[] memory _oracles,
        IERC20WithDeciamls[] memory _tokens,
        address _pool
    ) {
        pool = ICurvePool(_pool);
        oracles = _oracles;
        tokens = _tokens;
    }

    function fetchPrice() external view returns (uint256) {
        return _fetchPrice().mul(1e18).div(2 ** 112);
    }

    function tokenPrice(uint256 idx) public view returns (uint256) {
        return _getCurrentChainlinkResponse(tokens[idx], oracles[idx]);
    }

    // this code is a port of AlphaHomora's fair LP oracle
    // https://github.com/AlphaFinanceLab/alpha-homora-v2-contract/blob/master/contracts/oracle/CurveOracle.sol
    function _fetchPrice() internal view returns (uint) {
        uint256 minPx = type(uint256).max;

        for (uint idx = 0; idx < tokens.length; idx++) {
            IERC20WithDeciamls token = tokens[idx];
            uint8 _decimals = token.decimals();
            AggregatorV3Interface oracle = oracles[idx];

            uint tokenPx = _getCurrentChainlinkResponse(token, oracle);

            // adjust for decimals
            if (_decimals < 8)
                tokenPx = tokenPx.div(10 ** (8 - uint(_decimals)));
            if (_decimals > 8)
                tokenPx = tokenPx.mul(10 ** (uint(_decimals) - 8));

            // find min price
            if (tokenPx < minPx) minPx = tokenPx;
        }

        require(minPx != type(uint256).max, "no min px");

        // use min underlying token prices
        return minPx.mul(pool.get_virtual_price()).div(1e8);
    }

    /// @dev Return token price, multiplied by 2**112
    /// @param token Token address to get price
    /// @param agg Chainlink aggreagtor to pass
    function _getCurrentChainlinkResponse(
        IERC20WithDeciamls token,
        AggregatorV3Interface agg
    ) internal view returns (uint256) {
        uint256 _decimals = uint256(token.decimals());
        (, int answer, , uint256 updatedAt, ) = agg.latestRoundData();

        require(
            updatedAt >= block.timestamp.sub(maxDelayTime),
            "delayed update time"
        );

        return uint256(answer).mul(2 ** 112).div(10 ** _decimals);
    }

    function decimals() external pure override returns (uint8) {
        return uint8(TARGET_DIGITS);
    }

    function description() external pure override returns (string memory) {
        return "A chainlink v3 aggregator for Curve LP tokens.";
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
        return (_roundId, int256(_fetchPrice()), 0, block.timestamp, _roundId);
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
        return (1, int256(_fetchPrice()), 0, block.timestamp, 1);
    }

    function latestAnswer() external view override returns (int256) {
        return int256(_fetchPrice());
    }

    function latestTimestamp() external view override returns (uint256) {
        return block.timestamp;
    }

    function latestRound() external view override returns (uint256) {
        return block.timestamp;
    }

    function getAnswer(uint256) external view override returns (int256) {
        return int256(_fetchPrice());
    }

    function getTimestamp(uint256) external view override returns (uint256) {
        return block.timestamp;
    }
}
