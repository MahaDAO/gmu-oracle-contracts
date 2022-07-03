//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {IPriceFeed} from "./interfaces/IPriceFeed.sol";
import {Epoch} from "./utils/Epoch.sol";

/**
 * An always appreciating price feed. Cruicial because the GMU peg needs to always continue to
 * appreciate. This oracle appreciates the price across a certain period of time.
 *
 * Price updates should be recieved from another contract which calculates and
 * understands by how much should the price be updated by.
 *
 * @author Steven Enamakel enamakel@mahadao.com
 */
contract GMUOracle is IPriceFeed, Epoch {
    using SafeMath for uint256;

    string public name;
    uint256 public targetDigits = 18;

    /**
     * @dev last captured price from the 7 day oracle
     */
    uint256 public lastPrice7d;

    /**
     * @dev last captured price from the 30 day oracle
     */
    uint256 public lastPrice30d;

    /**
     * @dev max price the gmu can change by per epoch; if this gets hit then
     * the oracle breaks and the protocol will have to restart using a new oracle.
     */
    uint256 public maxPriceChange;

    /**
     * @dev has the oracle been broken? If there was a large price change
     * in the target price then the oracle breaks reverting and stopping
     * the protocol.
     *
     * The only way for the protocol to continue operations is to use a new oracle
     * and disregard this one.
     */
    bool public broken;

    IPriceFeed public immutable oracle;

    mapping(uint256 => uint256) public priceHistory;
    uint256 public constant TARGET_DIGITS = 18;
    uint256 public immutable precision = 10**TARGET_DIGITS;
    uint256 public lastPriceIndex;

    uint256 internal cummulativePrice30d;
    uint256 internal cummulativePrice7d;

    uint256 public startPrice;
    uint256 public dampeningFactor;
    uint256 public endPrice;
    uint256 public endPriceTime;
    uint256 public startPriceTime;
    uint256 internal _priceDiff;
    uint256 internal _timeDiff;

    constructor(
        string memory _name,
        uint256 _startingPrice18,
        uint256 _dampeningFactor18,
        address _oracle,
        uint256[] memory _priceHistory30d,
        uint256 _maxPriceChange
    ) Epoch(86400, block.timestamp, 0) {
        name = _name;

        startPrice = _startingPrice18;
        endPrice = _startingPrice18;
        endPriceTime = block.timestamp;
        startPriceTime = block.timestamp;

        maxPriceChange = _maxPriceChange;

        for (uint256 index = 0; index < 30; index++) {
            priceHistory[index] = _priceHistory30d[index];
            cummulativePrice30d += _priceHistory30d[index];
            if (index < 7) cummulativePrice7d += _priceHistory30d[index];
        }

        oracle = IPriceFeed(_oracle);
        dampeningFactor = _dampeningFactor18;
    }

    function fetchPrice() external override returns (uint256) {
        return _fetchPriceAt(block.timestamp);
    }

    function fetchPriceAt(uint256 time) external returns (uint256) {
        return _fetchPriceAt(time);
    }

    function _fetchPriceAt(uint256 time) internal returns (uint256) {
        require(!broken, "oracle is broken"); // failsafe check
        if (_callable()) _updatePrice();

        if (startPriceTime >= time) return startPrice;
        if (endPriceTime <= time) return endPrice;

        uint256 percentage = (time.sub(startPriceTime)).mul(1e24).div(
            _timeDiff
        );

        return startPrice + _priceDiff.mul(percentage).div(1e24);
    }

    function _notifyNewPrice(uint256 newPrice, uint256 extraTime) internal {
        require(extraTime > 0, "bad time");

        startPrice = _fetchPriceAt(block.timestamp);
        require(newPrice > startPrice, "bad price");

        endPrice = newPrice;
        endPriceTime = block.timestamp + extraTime;
        startPriceTime = block.timestamp;

        _priceDiff = endPrice.sub(startPrice);
        _timeDiff = endPriceTime.sub(startPriceTime);
    }

    function _updatePrice() internal checkEpoch {
        _updateTWAP();

        uint256 price30d = cummulativePrice30d / 30;
        uint256 price7d = cummulativePrice7d / 30;

        // If we are going to change the price, check if both the 30d and 7d price are
        // appreciating
        if (price30d > lastPrice30d && price7d > lastPrice7d) {
            // Calculate for appreciation using the 30d price feed
            uint256 delta = price30d.sub(lastPrice30d);
            uint256 percentChange = delta.mul(10**targetDigits).div(
                lastPrice30d
            );

            if (percentChange > maxPriceChange) {
                // dont change the price and break the oracle
                broken = true;
                return;
            }

            broken = false;

            // Appreciate the price by the same %. Since this is an addition; the price
            // can only go up.
            uint256 newPrice = endPrice +
                endPrice
                    .mul(percentChange)
                    .div(precision)
                    .mul(dampeningFactor)
                    .div(precision);
            _notifyNewPrice(newPrice, 86400);
            emit LastGoodPriceUpdated(newPrice);
        }

        // Update the price from feed(curr. chainlink only) to point to latest market data.
        lastPrice7d = price7d;
        lastPrice30d = price30d;
    }

    function _updateTWAP() internal {
        // record the new price point
        priceHistory[lastPriceIndex] = oracle.fetchPrice();

        // update the 30d and 7d TWAPs
        cummulativePrice30d = _updateSpecificTWAP(cummulativePrice30d, 30);
        cummulativePrice7d = _updateSpecificTWAP(cummulativePrice7d, 7);

        lastPriceIndex += 1;
    }

    function _updateSpecificTWAP(uint256 _cummulativePrice, uint256 _duration)
        internal
        returns (uint256)
    {
        // check the price deviation
        uint256 minPrice = Math.min(
            priceHistory[lastPriceIndex],
            priceHistory[lastPriceIndex - 1]
        );
        uint256 maxPrice = Math.max(
            priceHistory[lastPriceIndex],
            priceHistory[lastPriceIndex - 1]
        );

        // % of change in e18 from 0-1
        uint256 priceChange18 = maxPrice.sub(minPrice).mul(precision).div(
            maxPrice
        );

        // break the oracle if there is too much price deviation
        if (priceChange18 > maxPriceChange) broken = true;

        _cummulativePrice += priceHistory[lastPriceIndex];
        _cummulativePrice -= priceHistory[lastPriceIndex - _duration];

        return _cummulativePrice;
    }

    function getDecimalPercision() external view override returns (uint256) {
        return targetDigits;
    }
}
