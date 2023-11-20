import type { PluginObj } from "@babel/core";

import * as BabelCore from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import fs from "node:fs/promises";
import { parse, print } from "recast";
import ts from "typescript";

export type Babel = typeof BabelCore;

export async function runBabelTransform(code: string, filePath: string, transform: (file: Babel) => PluginObj) {
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
  const result = print(transformedAst).code;
  return result;
}

export async function runTypescriptTransform(
  currentDir = process.cwd(),
  transformer: (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>,
): Promise<void> {
  const configFile = ts.findConfigFile(currentDir, ts.sys.fileExists, "tsconfig.build.json");
  if (!configFile) throw Error("tsconfig.json not found");
  const { config } = ts.readConfigFile(configFile, ts.sys.readFile);

  const { options, fileNames, errors } = ts.parseJsonConfigFileContent(config, ts.sys, currentDir);
  const program = ts.createProgram({ options, rootNames: fileNames, configFileParsingDiagnostics: errors });
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const sourceFiles = program.getSourceFiles();
  const newSourceFiles = sourceFiles
    .filter((sourceFile) => sourceFile.fileName.includes(`${currentDir}/src`))
    .flatMap((sourceFile) => ts.transform(sourceFile, [transformer(program)]).transformed);
  return Promise.all(
    newSourceFiles.map(async (sourceFile) => {
      await fs.rm(sourceFile.fileName);
      return fs.writeFile(sourceFile.fileName, printer.printFile(sourceFile));
    }),
  ).then(() => undefined);
}
