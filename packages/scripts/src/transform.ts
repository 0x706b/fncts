import fs from "fs/promises";
import glob from "glob";

import { runBabelTransform } from "./codemod/util.js";

const transformName = process.argv[2];
const path          = process.argv[3];

if (!transformName) {
  console.error("No transform specified.");
  process.exit(1);
}

if (!path) {
  console.error("No files specified.");
  process.exit(1);
}

const matches = await new Promise<string[]>((resolve, reject) => {
  glob(path, (err, matches) => {
    if (err) {
      reject(err);
    } else {
      resolve(matches);
    }
  });
});

const transform = await import(`./codemod/${transformName}.js`).then((module) => module.default);

await Promise.all(
  matches.map(async (fileName) => {
    const code            = await fs.readFile(fileName, { encoding: "utf-8" });
    const transformedCode = await runBabelTransform(code, fileName, transform);
    await fs.writeFile(fileName, transformedCode);
  }),
);
