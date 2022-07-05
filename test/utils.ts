import { ethers } from "hardhat";
import { ParamType } from "ethers/lib/utils";
import { Block } from "@ethersproject/providers";
import fs from "fs";
import CSV from "csv-reader";
import path from "path";

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

export type IData = {
  price: number;
  average7D: number;
  average30D: number;
  arthPrice: number;
  date: string;
};

export const readCSV = (filename: string) =>
  new Promise<IData[]>((resolve) => {
    const inputStream = fs.createReadStream(
      path.resolve(__dirname, filename),
      "utf8"
    );

    const data: IData[] = [];

    inputStream
      .pipe(
        new CSV({
          parseNumbers: true,
          parseBooleans: true,
          trim: true,
        })
      )
      .on("data", (row: any[]) => {
        if (row[1] === "date") return;
        data.push({
          date: row[1],
          price: row[2],
          average7D: row[3],
          average30D: row[4],
          arthPrice: row[5],
        });
      })
      .on("end", () => resolve(data));
  });
