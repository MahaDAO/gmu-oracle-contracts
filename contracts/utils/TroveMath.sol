// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TroveMath {
  /**
   * @dev returns how much debt is currently in the protocol
   */
  function getProtocolDebt() external pure returns (uint256 debt) {
    debt = 0;
  }

  /**
   * @dev returns how much collateral is in the protocol (in GMU terms)
   */
  function getProtocolCollateralInGMU()
    external
    pure
    returns (uint256 collateralInGMU)
  {
    collateralInGMU = 0;
  }

  function getProtocolStats()
    external
    pure
    returns (uint256 collateralInGMU, uint256 debt)
  {
    debt = 0;
    collateralInGMU = 0;
  }
}
