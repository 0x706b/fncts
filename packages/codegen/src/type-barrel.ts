import * as path from "path";
import * as glob from "glob";
import { parse } from "@babel/parser";
import generate from "@babel/generator";

import type { Preset } from "eslint-plugin-codegen";

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
const typeBarrel: Preset<{
  include?: string;
  exclude?: string | string[];
}> = ({ meta, options: opts }) => {
  const cwd = path.dirname(meta.filename);

  const ext = meta.filename.split(".").slice(-1)[0];
  const pattern = opts.include || `*.${ext}`;

  const relativeFiles = glob
    .sync(pattern, { cwd, ignore: opts.exclude })
    .filter((f) => path.resolve(cwd, f) !== path.resolve(meta.filename))
    .map((f) => `./${f}`.replace(/(\.\/)+\./g, "."))
    .filter((file) =>
      [".js", ".mjs", ".ts", ".tsx"].includes(path.extname(file))
    )
    .map((f) => f.replace(/\.\w+$/, "") + ".js");

  const expectedContent = relativeFiles.map((f) => `export type {} from '${f}'`).join("\n");

  // ignore stylistic differences. babel generate deals with most
  const normalise = (str: string) =>
    generate(
      parse(str, { sourceType: "module", plugins: ["typescript"] }) as any
    )
      .code.replace(/'/g, `"`)
      .replace(/\/index/g, "");

  try {
    if (normalise(expectedContent) === normalise(meta.existingContent)) {
      return meta.existingContent;
    }
  } catch {}

  return expectedContent;
};

module.exports = typeBarrel;
