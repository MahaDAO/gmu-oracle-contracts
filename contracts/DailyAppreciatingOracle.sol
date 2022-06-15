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
contract DailyAppreciatingOracle is IPriceFeed, Epoch {
    using SafeMath for uint256;

    string public name;

    IPriceFeed public priceFeed7D;
    IPriceFeed public priceFeed30D;

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
     * @dev last recorded price of the gmu.
     */
    uint256 public lastPrice;

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

    constructor(
        string memory _name,
        uint256 _startingPrice,
        address _priceFeed7D,
        address _priceFeed30D,
        uint256 _maxPriceChange
    ) Epoch(86400, block.timestamp, 0) {
        name = _name;
        lastPrice = _startingPrice;
        maxPriceChange = _maxPriceChange;

        priceFeed7D = IPriceFeed(_priceFeed7D);
        priceFeed30D = IPriceFeed(_priceFeed30D);

        require(
            priceFeed30D.getDecimalPercision() == targetDigits,
            "bad 30d percision"
        );
        require(
            priceFeed7D.getDecimalPercision() == targetDigits,
            "bad 7d percision"
        );
    }

    function _updatePrice() internal checkEpoch {
        uint256 price7d = priceFeed7D.fetchPrice();
        uint256 price30d = priceFeed30D.fetchPrice();

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
            lastPrice += lastPrice.mul(percentChange).div(10**targetDigits);
            emit LastGoodPriceUpdated(lastPrice);
        }

        // Update the price from feed(curr. chainlink only) to point to latest market data.
        lastPrice7d = price7d;
        lastPrice30d = price30d;
    }

    function fetchPrice() external override returns (uint256) {
        require(!broken, "oracle is broken"); // failsafe check
        if (_callable()) _updatePrice();
        return lastPrice;
    }

    function getDecimalPercision() external view override returns (uint256) {
        return targetDigits;
    }
}
