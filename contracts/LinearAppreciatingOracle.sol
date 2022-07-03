//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IPriceFeed} from "./interfaces/IPriceFeed.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * An appreciating oracle that linearly appreciates a value over time.
 *
 * @author Steven Enamakel enamakel@mahadao.com
 */
contract LinearAppreciatingOracle is IPriceFeed, Ownable {
    using SafeMath for uint256;

    string public name;
    uint256 public startPrice;
    uint256 public endPrice;
    uint256 public endPriceTime;
    uint256 public startPriceTime;
    uint256 public targetDigits = 18;

    uint256 internal _priceDiff;
    uint256 internal _timeDiff;

    constructor(string memory _name, uint256 _startingPrice) {
        name = _name;
        startPrice = _startingPrice;
        endPrice = _startingPrice;
        endPriceTime = block.timestamp;
        startPriceTime = block.timestamp;
    }

    function notifyNewPrice(uint256 newPrice, uint256 extraTime)
        external
        onlyOwner
    {
        require(extraTime > 0, "bad time");

        startPrice = _fetchPriceAt(block.timestamp);
        require(newPrice > startPrice, "bad price");

        endPrice = newPrice;
        endPriceTime = block.timestamp + extraTime;
        startPriceTime = block.timestamp;

        _priceDiff = endPrice.sub(startPrice);
        _timeDiff = endPriceTime.sub(startPriceTime);
    }

    function fetchPrice() external view override returns (uint256) {
        return _fetchPriceAt(block.timestamp);
    }

    function fetchPriceAt(uint256 time) external view returns (uint256) {
        return _fetchPriceAt(time);
    }

    function _fetchPriceAt(uint256 time) internal view returns (uint256) {
        if (startPriceTime >= time) return startPrice;
        if (endPriceTime <= time) return endPrice;

        uint256 percentage = (time.sub(startPriceTime)).mul(1e24).div(
            _timeDiff
        );

        return startPrice + _priceDiff.mul(percentage).div(1e24);
    }

    function getDecimalPercision() external view override returns (uint256) {
        return targetDigits;
    }

    function timestamp() external view returns (uint256) {
        // for testing purposes
        return block.timestamp;
    }
}
