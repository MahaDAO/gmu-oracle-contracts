// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Epoch} from "./utils/Epoch.sol";
import {IPriceFeed} from "./interfaces/IPriceFeed.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * A simple time-weighted oracle. useful for creating flashloan resistant oracles.
 * The oracles have an additional parameter to add resistance to major price fluctuations.
 *
 * @author Steven Enamakel <enamakel@mahadao.com>
 */
contract TWAPOracle is Epoch, IPriceFeed {
    using SafeMath for uint256;

    IPriceFeed public oracle;
    uint256 private priceCache;

    uint256 public lastPriceIndex;
    mapping(uint256 => uint256) public priceHistory;
    uint256 public constant TARGET_DIGITS = 18;

    uint256 public precision = 10**TARGET_DIGITS;
    uint256 public maxPriceChange;

    constructor(
        address _oracle,
        uint256 _epoch,
        uint256 _maxPriceChange
    ) Epoch(_epoch, block.timestamp, 0) {
        oracle = IPriceFeed(_oracle);

        maxPriceChange = _maxPriceChange;

        // prefill the first few epochs
        uint256 price = oracle.fetchPrice();
        priceHistory[0] = price;
        priceHistory[1] = price;
        priceHistory[2] = price;
        priceHistory[3] = price;

        lastPriceIndex = 3;
    }

    function updatePrice() public checkEpoch {
        // record the new price point
        lastPriceIndex += 1;
        priceHistory[lastPriceIndex] = oracle.fetchPrice();

        // check the price deviation
        uint256 minPrice = Math.min(
            priceHistory[lastPriceIndex],
            priceHistory[lastPriceIndex - 1]
        );
        uint256 maxPrice = Math.max(
            priceHistory[lastPriceIndex],
            priceHistory[lastPriceIndex - 1]
        );
        uint256 priceChange = maxPrice
            .sub(minPrice)
            .mul(precision)
            .mul(100)
            .div(maxPrice);
        require(
            priceChange < maxPriceChange,
            "TWAPOracle: too much price deviation"
        );

        priceCache = calculatePrice();
    }

    function fetchPrice() external view override returns (uint256) {
        // avoids returning a stale price
        require(!_callable(), "TWAPOracle: price is stale");
        return priceCache;
    }

    function calculatePrice() public view returns (uint256) {
        // take out the last 3 price points and
        uint256 priceTotal = 0;
        for (
            uint256 index = lastPriceIndex;
            index > lastPriceIndex - 3;
            index--
        ) {
            priceTotal = priceTotal.add(priceHistory[index]);
        }

        return priceTotal.div(3); // average it out!
    }

    function getDecimalPercision() external pure override returns (uint256) {
        return TARGET_DIGITS;
    }
}
