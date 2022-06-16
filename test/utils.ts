import { ethers } from "hardhat";
import { ParamType } from "ethers/lib/utils";
import { Block } from "@ethersproject/providers";

export function encodeParameters(
  types: Array<string | ParamType>,
  values: Array<any>
) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

export async function latestBlocktime(): Promise<number> {
  const { timestamp } = await ethers.provider.getBlock("latest");
  return timestamp;
}

export async function advanceTime(time: number): Promise<void> {
  return ethers.provider.send("evm_increaseTime", [time]);
}

export async function advanceBlock(): Promise<Block> {
  await ethers.provider.send("evm_mine", []);
  return await ethers.provider.getBlock("latest");
}

export async function advanceTimeAndBlock(time: number): Promise<Block> {
  await advanceTime(time);
  await advanceBlock();
  return Promise.resolve(ethers.provider.getBlock("latest"));
}
