// This file is forked from https://github.com/mmkal/ts/blob/main/packages/eslint-plugin-codegen/src/presets/barrel.ts
// to add the `.js` extension to exports

import type { Preset } from "./codegen";
import type {} from "./internal/Array.js";

import generate from "@babel/generator";
import { parse } from "@babel/parser";
import * as glob from "glob";
import camelCase from "lodash/camelCase";
import * as path from "path";
import { match, P } from "ts-pattern";

/**
 * Bundle several modules into a single convenient one.
 *
 * @example
 * // codegen:start {preset: barrel, include: some/path/*.ts, exclude: some/path/*util.ts}
 * export * from './some/path/module-a'
 * export * from './some/path/module-b'
 * export * from './some/path/module-c'
 * // codegen:end
 *
 * @param include
 * [optional] If specified, the barrel will only include file paths that match this glob pattern
 * @param exclude
 * [optional] If specified, the barrel will exclude file paths that match these glob patterns
 * @param import
 * [optional] If specified, matching files will be imported and re-exported rather than directly exported
 * with `export * from './xyz'`. Use `import: star` for `import * as xyz from './xyz'` style imports.
 * Use `import: default for `import xyz from './xyz'` style imports.
 * @param export
 * [optional] Only valid if the import style has been specified (either `import: star` or `import: default`).
 * If specified, matching modules will be bundled into a const or default export based on this name. If set
 * to `{name: someName, keys: path}` the relative file paths will be used as keys. Otherwise the file paths
 * will be camel-cased to make them valid js identifiers.
 */
const barrel: Preset<{
  include?: string;
  exclude?: string | string[];
  import?: "default" | "star";
  export?: string | { name: string; keys: "path" | "camelCase" };
}> = ({ context, options: opts, existingContent }) => {
  const cwd = path.dirname(context.physicalFilename);

  const ext     = context.physicalFilename.split(".").slice(-1)[0];
  const pattern = opts.include || `*.${ext}`;

  const paths = glob
    .sync(pattern, { cwd, ignore: opts.exclude })
    .sort((a, b) => a.localeCompare(b));

  const relativeFiles: Array<string> = [];

  for (let p of paths) {
    if (path.resolve(cwd, p) === path.resolve(context.physicalFilename)) {
      continue;
    }
    p = `./${p}`.replace(/(\.\/)+\./g, ".");
    if (![".js", ".mjs", ".ts", ".tsx"].includes(path.extname(p))) {
      continue;
    }
    p = p.replace(/\.\w+$/, "") + ".js";
    relativeFiles.push(p);
  }

  const expectedContent = match(opts.import)
    .with(undefined, () => {
      return relativeFiles.map((f) => `export * from '${f}'`).join("\n");
    })
    .with(P.string, (s) => {
      const importPrefix = s === "default" ? "" : "* as ";
      const groups       = relativeFiles
        .map((f) => ({
          file: f,
          identifier: camelCase(f)
            .replace(/^([^a-z])/, "_$1")
            .replace(/Index$/, ""),
        }))
        .groupBy(({ identifier }) => identifier);

      const withIdentifiers = Object.values(groups).flatMap((group) =>
        group.length === 1
          ? group
          : group.map((info, i) => ({
              ...info,
              identifier: `${info.identifier}_${i + 1}`,
            })),
      );

      const imports = withIdentifiers
        .map((i) => `import ${importPrefix}${i.identifier} from '${i.file}'`)
        .join("\n");

      const exportProps = match(opts.export)
        .with({ name: P.string, keys: "path" }, () =>
          withIdentifiers.map(
            (i) => `${JSON.stringify(i.file)}: ${i.identifier}`,
          ),
        )
        .otherwise(() => withIdentifiers.map((i) => i.identifier));

      const exportPrefix = match(opts.export)
        .with(undefined, () => "export")
        .with("default", () => "export default")
        .with({ name: "default" }, () => "export default")
        .with(P.string, (name) => `export const ${name} =`)
        .with({ name: P.string }, ({ name }) => `export const ${name} =`)
        .exhaustive();

      const exports = exportProps.join(",\n ");

      return `${imports}\n\n${exportPrefix} {\n ${exports}\n}\n`;
    })
    .exhaustive();

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

export default barrel;
