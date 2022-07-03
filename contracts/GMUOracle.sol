//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
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
    uint256 public immutable dampeningFactor;

    mapping(uint256 => uint256) public priceHistory;
    uint256 public lastPriceIndex;

    uint256 internal _cummulativePrice30d;
    uint256 internal _cummulativePrice7d;
    uint256 internal _startPrice;
    uint256 internal _endPrice;
    uint256 internal _endPriceTime;
    uint256 internal _startPriceTime;
    uint256 internal _priceDiff;
    uint256 internal _timeDiff;

    constructor(
        uint256 _startingPrice18,
        uint256 _dampeningFactor18,
        address _oracle,
        uint256[] memory _priceHistory30d,
        uint256 _maxPriceChange
    ) Epoch(86400, block.timestamp, 0) {
        _startPrice = _startingPrice18;
        _endPrice = _startingPrice18;
        _endPriceTime = block.timestamp;
        _startPriceTime = block.timestamp;

        maxPriceChange = _maxPriceChange;

        for (uint256 index = 0; index < 30; index++) {
            priceHistory[index] = _priceHistory30d[index];
            _cummulativePrice30d += _priceHistory30d[index];
            if (index < 7) _cummulativePrice7d += _priceHistory30d[index];
        }

        lastPrice30d = _cummulativePrice30d / 30;
        lastPrice7d = _cummulativePrice7d / 7;

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
        if (_callable()) _updatePrice(); // update oracle if needed

        if (_startPriceTime >= time) return _startPrice;
        if (_endPriceTime <= time) return _endPrice;

        uint256 percentage = (time.sub(_startPriceTime)).mul(1e24).div(
            _timeDiff
        );

        return _startPrice + _priceDiff.mul(percentage).div(1e24);
    }

    function _notifyNewPrice(uint256 newPrice, uint256 extraTime) internal {
        require(extraTime > 0, "bad time");

        _startPrice = _fetchPriceAt(block.timestamp);
        require(newPrice > _startPrice, "bad price");

        _endPrice = newPrice;
        _endPriceTime = block.timestamp + extraTime;
        _startPriceTime = block.timestamp;

        _priceDiff = _endPrice.sub(_startPrice);
        _timeDiff = _endPriceTime.sub(_startPriceTime);
    }

    function _updatePrice() internal checkEpoch {
        _updateTWAP();

        uint256 price30d = _cummulativePrice30d / 30;
        uint256 price7d = _cummulativePrice7d / 7;

        // If we are going to change the price, check if both the 30d and 7d price are
        // appreciating
        if (price30d > lastPrice30d && price7d > lastPrice7d) {
            // Calculate for appreciation using the 30d price feed
            uint256 delta = price30d.sub(lastPrice30d);

            // % of change in e18 from 0-1
            uint256 priceChange18 = delta.mul(1e18).div(lastPrice30d);

            if (priceChange18 > maxPriceChange) {
                // dont change the price and break the oracle
                broken = true;
                return;
            }

            // Appreciate the price by the same %. Since this is an addition; the price
            // can only go up.
            uint256 newPrice = _endPrice +
                _endPrice.mul(priceChange18).div(1e18).mul(dampeningFactor).div(
                    1e18
                );
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
        _cummulativePrice30d = _updateSpecificTWAP(_cummulativePrice30d, 30);
        _cummulativePrice7d = _updateSpecificTWAP(_cummulativePrice7d, 7);

        lastPriceIndex += 1;
    }

    function _updateSpecificTWAP(uint256 _cummulativePrice, uint256 _duration)
        internal
        view
        returns (uint256)
    {
        _cummulativePrice += priceHistory[lastPriceIndex];
        _cummulativePrice -= priceHistory[lastPriceIndex - _duration];

        return _cummulativePrice;
    }

    function getDecimalPercision() external pure override returns (uint256) {
        return 18;
    }
}
