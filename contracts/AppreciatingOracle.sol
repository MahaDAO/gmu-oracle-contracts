//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {IAppreciatingGMUOracle} from "./interfaces/IAppreciatingGMUOracle.sol";

/**
 * An always appreciating price feed. Cruicial because the GMU peg needs to always continue to
 * appreciate. This oracle appreciates the price across a certain period of time.
 *
 * Price updates should be recieved from another contract which calculates and
 * understands by how much should the price be updated by.
 *
 * @author Steven Enamakel enamakel@mahadao.com
 */
contract AppreciatingOracle is Ownable, IAppreciatingGMUOracle {
  using SafeMath for uint256;

  struct ChainlinkResponse {
    uint80 roundId;
    int256 answer;
    uint256 timestamp;
    bool success;
    uint8 decimals;
  }

  string public name;
  uint256 public constant TARGET_DIGITS = 6;

  uint256 public currFeedPrice; // curr. price from feed(e.g chainlink or tellor).
  uint256 public currPrice = 10 ** TARGET_DIGITS; // curr. price of the gmu.

  AggregatorV3Interface public chainlinkFeed;

  event PriceChange(uint256 timestamp, uint256 price, uint256 nextPrice);
  event ChainklinkFeedChange(uint256 timestamp, uint256 price, uint256 nextPrice);
  event ChainlinkFeedChanged(address indexed old, address indexed curr, uint256 timestamp);

  constructor(
    string memory _name,
    uint256 startingPrice,
    address _governance,
    AggregatorV3Interface _chainlinkFeed
  ) {
    name = _name;
    currPrice = startingPrice;
    chainlinkFeed = _chainlinkFeed;
    currFeedPrice = _getFeedPrice();
    _transferOwnership(_governance);
  }

  function updateChainlinkFeed(AggregatorV3Interface feed) external override onlyOwner {
    require(address(feed) != address(chainlinkFeed), "Feed up-to-date");
    require(address(feed) != address(0), "Feed = address(0)");

    address oldFeed = address(chainlinkFeed);
    chainlinkFeed = feed;

    // solhint-disable-next-line
    emit ChainlinkFeedChanged(oldFeed, address(feed), block.timestamp);
  }

  function getPrice() external override returns (uint256) {
    uint256 newFeedPrice = _getFeedPrice();

    if (newFeedPrice > currFeedPrice) { // Check for appreciation.
      uint256 delta = newFeedPrice.sub(currFeedPrice);
      uint256 percentChange = delta.mul(10 ** TARGET_DIGITS).div(currFeedPrice);

      uint256 _oldPrice = currPrice;
      currPrice += currPrice.mul(percentChange).div(10 ** TARGET_DIGITS);  // Appreciate the price by the same %.
      // solhint-disable-next-line
      emit PriceChange(block.timestamp, _oldPrice, currPrice);
    }

    uint256 _oldFeedPrice = currFeedPrice;
    currFeedPrice = newFeedPrice; // Update the price from feed(curr. chainlink only) to point to latest market data.
    // solhint-disable-next-line
    emit ChainklinkFeedChange(block.timestamp, _oldFeedPrice, currFeedPrice);

    return currPrice;
  }

  function getDecimalPercision() public override pure returns (uint256) {
    return TARGET_DIGITS;
  }

  function _getFeedPrice() internal returns (uint256) {
    // TODO: add another oracle like tellor here for better resistance against
    // oracle manipulation attacks.
    return _fetchChainlinkPrice();
  }

  function _scalePriceByDigits(uint256 _price, uint256 _answerDigits)
    internal
    pure
    returns (uint256)
  {
    // Convert the price returned by the oracle to an 18-digit decimal for use.
    uint256 price;
    if (_answerDigits >= TARGET_DIGITS) {
      // Scale the returned price value down to Liquity's target precision
      price = _price.div(10**(_answerDigits - TARGET_DIGITS));
    } else if (_answerDigits < TARGET_DIGITS) {
      // Scale the returned price value up to Liquity's target precision
      price = _price.mul(10**(TARGET_DIGITS - _answerDigits));
    }
    return price;
  }

  function _fetchChainlinkPrice()
    internal
    view
    returns (uint256)
  {
    ChainlinkResponse memory chainlinkResponse = _getCurrentChainlinkResponse();
    uint256 scaledChainlinkPrice = _scalePriceByDigits(
      uint256(chainlinkResponse.answer),
      chainlinkResponse.decimals
    );
    return scaledChainlinkPrice;
  }

  function _getCurrentChainlinkResponse()
    internal
    view
    returns (ChainlinkResponse memory chainlinkResponse)
  {
    // First, try to get current decimal precision:
    try chainlinkFeed.decimals() returns (uint8 decimals) {
      // If call to Chainlink succeeds, record the current decimal precision
      chainlinkResponse.decimals = decimals;
    } catch {
      // If call to Chainlink aggregator reverts, return a zero response with success = false
      return chainlinkResponse;
    }

    // Secondly, try to get latest price data:
    try chainlinkFeed.latestRoundData() returns (
      uint80 roundId,
      int256 answer,
      uint256, /* startedAt */
      uint256 timestamp,
      uint80 /* answeredInRound */
    ) {
      // If call to Chainlink succeeds, return the response and success = true
      chainlinkResponse.roundId = roundId;
      chainlinkResponse.answer = answer;
      chainlinkResponse.timestamp = timestamp;
      chainlinkResponse.success = true;
      return chainlinkResponse;
    } catch {
      // If call to Chainlink aggregator reverts, return a zero response with success = false
      return chainlinkResponse;
    }
  }
}
