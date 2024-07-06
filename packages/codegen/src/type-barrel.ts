import type { Preset } from "./codegen.js";

import generate from "@babel/generator";
import { parse } from "@babel/parser";
import * as glob from "glob";
import * as path from "path";

const typeBarrel: Preset<{
  include?: string;
  exclude?: string | string[];
}> = ({ context, existingContent, options: opts }) => {
  const cwd = path.dirname(context.physicalFilename);

  const ext     = context.physicalFilename.split(".").slice(-1)[0];
  const pattern = opts.include || `*.${ext}`;

  const paths = glob.sync(pattern, { cwd, ignore: opts.exclude });

  const relativeFiles: Array<string> = [];

  for (let p of paths) {
    if (path.resolve(cwd, p) === path.resolve(context.physicalFilename)) {
      continue;
    }
    p = `./${p}`.replace(/(\.\/)+\./g, ".");
    if ([".js", ".mjs", ".ts", ".tsx"].includes(path.extname(p))) {
      continue;
    }
    p = p.replace(/\.\w+$/, "") + ".js";
    relativeFiles.push(p);
  }

  const expectedContent = relativeFiles
    .map((f) => `export type {} from '${f}'`)
    .join("\n");

  // ignore stylistic differences. babel generate deals with most
  const normalise = (str: string) =>
    generate(
      parse(str, { sourceType: "module", plugins: ["typescript"] }) as any,
    )
      .code.replace(/'/g, '"')
      .replace(/\/index/g, "");

  try {
    if (normalise(expectedContent) === normalise(existingContent)) {
      return existingContent;
    }
  } catch {}

  return expectedContent;
};

export default typeBarrel;
