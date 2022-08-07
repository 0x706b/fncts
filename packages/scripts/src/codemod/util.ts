import type { PluginObj } from "@babel/core";

import * as BabelCore from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import glob from "glob";
import { parse, print } from "recast";
import babelParser from "recast/parsers/babel-ts.js";

export type Babel = typeof BabelCore;

export async function runTransform(code: string, filePath: string, transform: (file: Babel) => PluginObj) {
  const ast: BabelCore.types.File = parse(code, {
    parser: {
      parse: (source: string) =>
        BabelCore.parseSync(source, {
          plugins: ["@babel/plugin-syntax-class-properties", "@babel/plugin-syntax-typescript"],
          filename: filePath,
          parserOpts: {
            tokens: true,
          },
        }),
    },
  });
  const transformResult = await transformFromAstAsync(ast, code, {
    plugins: [transform],
    cloneInputAst: false,
    code: false,
    ast: true,
  });
  if (transformResult === null || transformResult.ast == null) {
    throw new Error();
  }
  const transformedAst = transformResult.ast;
  const result         = print(transformedAst).code;
  return result;
}
