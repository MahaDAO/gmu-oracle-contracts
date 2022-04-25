// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {KeeperCompatibleInterface} from "../interfaces/KeeperCompatibleInterface.sol";
import {ITWAPOracle} from "../interfaces/ITWAPOracle.sol";

contract ChainlinkTWAPKeeper is Ownable, KeeperCompatibleInterface {
  ITWAPOracle[] public oracles;

  constructor(ITWAPOracle[] memory _oracles) {
    oracles = _oracles;
  }

  function addOracle(ITWAPOracle _oracle) external onlyOwner {
    oracles.push(_oracle);
  }

  function checkUpkeep(bytes calldata _checkData)
    external
    view
    override
    returns (bool upkeepNeeded, bytes memory performData)
  {
    performData = "";

    for (uint256 index = 0; index < oracles.length; index++) {
      if (oracles[index].callable()) upkeepNeeded = true;
    }
  }

  function performUpkeep(bytes calldata performData) external override {
    for (uint256 index = 0; index < oracles.length; index++) {
      if (oracles[index].callable()) oracles[index].updatePrice();
    }
  }
}
