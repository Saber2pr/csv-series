/*
 * @Author: saber2pr
 * @Date: 2019-07-17 13:52:45
 * @Last Modified by: saber2pr
 * @Last Modified time: 2019-07-17 15:03:55
 */
import { promisify } from "util";
import { readFile, writeFile } from "fs";
import { join } from "path";

const readF = promisify(readFile);
const writeF = promisify(writeFile);

class Config {
  public constructor(private name: string, public n: number) {}
  public get csv() {
    return join(process.cwd(), this.name);
  }
  public get output() {
    return join(process.cwd(), "(已处理)" + this.name);
  }
}

export async function main(name: string, n: number) {
  const config = new Config(name, n);
  const csv = await readF(config.csv).then(b => b.toString());

  const lines = csv.split("\n");
  const bodys = lines;

  const origin_bodys = sortedDedup(bodys);
  const series = seriesify(bodys, config.n);
  const new_bodys = createZERO(series);

  await writeF(config.output, new_bodys);
}

function sortedDedup(bodys: string[]) {
  const cache: {
    [k: string]: {
      index: number;
      value: string;
    };
  } = {};

  bodys.forEach((body, i) => {
    const meta = body.split(",");
    const name = meta[0];
    const val = meta[2];
    if (name in cache) {
      console.log("检测到重复项：", name);
      return;
    }
    if (val === "0") return;
    cache[name] = {
      index: i,
      value: body
    };
  });

  return Object.entries(cache)
    .map(([_, v]) => v)
    .sort((a, b) => a.index - b.index)
    .map(b => b.value);
}

function seriesify(lines: string[], n: number) {
  return [].concat(...lines.map(l => Array(n).fill(l)));
}

function createZERO(lines: string[]) {
  const result = [];

  const name_index = {
    name: lines[0].split(",")[0],
    index: 0
  };

  let zero_count = name_index.index;

  for (let i = 0; i < lines.length; ++i) {
    const meta = lines[i].split(",");

    if (meta[0] !== name_index.name) {
      name_index.name = meta[0];
      name_index.index++;
      zero_count = name_index.index;
    }

    if (zero_count) {
      meta[2] = "0";
      zero_count--;
    }

    result[i] = meta.join(",");
  }

  return result.join("\n");
}
