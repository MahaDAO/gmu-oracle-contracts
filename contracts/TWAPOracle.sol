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

    // @dev
    IPriceFeed public oracle;

    mapping(uint256 => uint256) public priceHistory;
    uint256 public constant TARGET_DIGITS = 18;
    uint256 public immutable precision = 10**TARGET_DIGITS;
    uint256 public immutable maxPriceChange;
    uint256 public immutable twapDuration;

    uint256 public lastPriceIndex;
    bool public broken = false;

    uint256 internal cummulativePrice;

    constructor(
        address _oracle,
        uint256[] memory _priceHistory,
        uint256 _epoch,
        uint256 _twapDuration,
        uint256 _maxPriceChange
    ) Epoch(_epoch, block.timestamp, 0) {
        oracle = IPriceFeed(_oracle);

        maxPriceChange = _maxPriceChange;
        twapDuration = _twapDuration;

        for (uint256 index = 0; index < _twapDuration; index++) {
            priceHistory[index] = _priceHistory[index];
            cummulativePrice += _priceHistory[index];
        }

        lastPriceIndex = _twapDuration;
    }

    function updatePrice() public checkEpoch {
        // record the new price point
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

        // % of change in e18 from 0-1
        uint256 priceChange18 = maxPrice.sub(minPrice).mul(precision).div(
            maxPrice
        );

        // break the oracle if there is too much price deviation
        if (priceChange18 > maxPriceChange) broken = true;

        cummulativePrice += priceHistory[lastPriceIndex];
        cummulativePrice -= priceHistory[lastPriceIndex - twapDuration];

        lastPriceIndex += 1;
    }

    function fetchPrice() external view override returns (uint256) {
        // avoids returning a stale price
        require(!broken, "TWAPOracle: oracle is broken");
        require(!_callable(), "TWAPOracle: price is stale");
        return cummulativePrice / twapDuration;
    }

    function getDecimalPercision() external pure override returns (uint256) {
        return TARGET_DIGITS;
    }
}
