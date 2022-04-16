// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { AggregatorV3Interface } from "./interfaces/AggregatorV3Interface.sol";
import { IPriceFeed } from "./interfaces/IPriceFeed.sol";
import { IOracle } from "./interfaces/IOracle.sol";
import { IUniswapV2Pair } from "./interfaces/IUniswapV2Pair.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IERC20WithDeciamls is IERC20 {
  function decimals() external view returns (uint256);
}

contract ChainlinkLPOracleGMU is IPriceFeed {
  using SafeMath for uint256;

  IUniswapV2Pair public lp;
  IERC20WithDeciamls public tokenA;
  IERC20WithDeciamls public tokenB;

  AggregatorV3Interface public tokenAoracle;
  AggregatorV3Interface public tokenBoracle;

  IOracle public gmuOracle;
  uint256 public constant TARGET_DIGITS = 18;

  struct ChainlinkResponse {
    uint80 roundId;
    int256 answer;
    uint256 timestamp;
    bool success;
    uint8 decimals;
  }

  constructor(
    address _tokenAoracle,
    address _tokenBoracle,
    address _gmuOracle,
    address _lp
  ) {
    lp = IUniswapV2Pair(_lp);
    tokenAoracle = AggregatorV3Interface(_tokenAoracle);
    tokenBoracle = AggregatorV3Interface(_tokenBoracle);
    gmuOracle = IOracle(_gmuOracle);

    tokenA = IERC20WithDeciamls(lp.token0());
    tokenB = IERC20WithDeciamls(lp.token1());
  }

  function priceFor(uint256 amount) external view returns (uint256) {
    return amount.mul(_fetchPrice()).div(1e18);
  }

  function fetchPrice() external view override returns (uint256) {
    return _fetchPrice();
  }

  function _fetchPrice() internal view returns (uint256) {
    uint256 totalSupply = lp.totalSupply();
    return totalGMUInLP().mul(1e18).div(totalSupply);
  }

  function totalGMUInLP() public view returns (uint256) {
    uint256 totalTokenAGMU = tokenAGMUInLP();
    uint256 totalTokenBGMU = tokenBGMUInLP();
    return totalTokenAGMU.add(totalTokenBGMU);
  }

  function tokenAGMUInLP() public view returns (uint256) {
    uint256 price = tokenAGMUPrice();
    (
      uint256 reserve0, /* uint256 reserve1 */ /* uint256 timestamp */
      ,

    ) = lp.getReserves();
    uint256 bal = _scalePriceByDigits(reserve0, tokenA.decimals());
    return price.mul(bal).div(1e18);
  }

  function tokenBGMUInLP() public view returns (uint256) {
    uint256 price = tokenBGMUPrice();
    (
      ,
      /* uint256 reserve0 */
      uint256 reserve1, /* uint256 timestamp */

    ) = lp.getReserves();
    uint256 bal = _scalePriceByDigits(reserve1, tokenB.decimals());
    return price.mul(bal).div(1e18);
  }

  function tokenAGMUPrice() public view returns (uint256) {
    return _fetchWithChainlink(tokenAoracle);
  }

  function tokenBGMUPrice() public view returns (uint256) {
    return _fetchWithChainlink(tokenBoracle);
  }

  function _fetchWithChainlink(AggregatorV3Interface agg)
    internal
    view
    returns (uint256)
  {
    uint256 gmuPrice = fetchGMUPrice();
    uint256 chainlinkPrice = _fetchChainlinkPrice(agg);
    return (chainlinkPrice.mul(10**TARGET_DIGITS).div(gmuPrice));
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

  function fetchGMUPrice() public view returns (uint256) {
    uint256 gmuPrice = gmuOracle.getPrice();
    uint256 gmuPricePrecision = gmuOracle.getDecimalPercision();
    return _scalePriceByDigits(gmuPrice, gmuPricePrecision);
  }

  function _fetchChainlinkPrice(AggregatorV3Interface agg)
    internal
    view
    returns (uint256)
  {
    ChainlinkResponse memory chainlinkResponse = _getCurrentChainlinkResponse(
      agg
    );
    uint256 scaledChainlinkPrice = _scalePriceByDigits(
      uint256(chainlinkResponse.answer),
      chainlinkResponse.decimals
    );
    return scaledChainlinkPrice;
  }

  function _getCurrentChainlinkResponse(AggregatorV3Interface agg)
    internal
    view
    returns (ChainlinkResponse memory chainlinkResponse)
  {
    // First, try to get current decimal precision:
    try agg.decimals() returns (uint8 decimals) {
      // If call to Chainlink succeeds, record the current decimal precision
      chainlinkResponse.decimals = decimals;
    } catch {
      // If call to Chainlink aggregator reverts, return a zero response with success = false
      return chainlinkResponse;
    }

    // Secondly, try to get latest price data:
    try agg.latestRoundData() returns (
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
