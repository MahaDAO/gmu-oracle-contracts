//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {IERC20Burnable} from "./interfaces/IERC20Burnable.sol";
import {IAppreciatingOracle} from "./interfaces/IAppreciatingOracle.sol";
import {Epoch} from "./utils/Epoch.sol";

/**
 * This contract is reponsible for burning ARTH based on the fees collected from the protocol.
 * The amount of ARTH that is burnt will be used to calcaulte how much ARTH is appreciated by.
 * So if 1% of ARTH supply is burnt, then ARTH appreciates by 1% respectively.
 */
contract Burner is Epoch {
  string public name;
  IERC20Burnable public arth;
  IAppreciatingOracle oracle;

  constructor(
    string memory _name,
    uint256 _epoch,
    address _governance
  ) Epoch(_epoch, block.timestamp, 0) {
    name = _name;
    _transferOwnership(_governance);
  }

  function appreciate() public checkEpoch {
    uint256 toBurn = arth.balanceOf(address(this));

    if (toBurn == 0) return;

    uint256 supply = arth.totalSupply();
    arth.burn(toBurn);

    // find out how much of the supply was burned; or rather how much
    // we should appreciate ARTH by?
    uint256 percOfSupplyBurned = toBurn.mul(1e9).div(supply);

    uint256 price = oracle.getPrice();
  }
}
