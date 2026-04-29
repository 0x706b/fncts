import { globSync } from "glob";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @param {string | URL} url
 * @returns {import("rolldown").RolldownOptions[]}
 */
export function makeRolldownConfig(url) {
  const packageDir = path.dirname(fileURLToPath(url));
  const esmDir     = path.join(packageDir, "build/esm");

  const input = Object.fromEntries(
    globSync(`${esmDir}/**/*.js`).map((file) => [
      path
        .relative(esmDir, file.slice(0, file.length - path.extname(file).length))
        .split(path.sep)
        .join("/"),
      path.resolve(file),
    ]),
  );

  return [
    {
      input,
      external: /.*/,
      output: {
        dir: "build/mjs",
        format: "esm",
        entryFileNames: "[name].mjs",
        chunkFileNames: "[name].mjs",
        sourcemap: true,
        cleanDir: true,
      },
    },
    {
      input,
      external: /.*/,
      output: {
        dir: "build/cjs",
        format: "cjs",
        entryFileNames: "[name].cjs",
        chunkFileNames: "[name].cjs",
        sourcemap: true,
        cleanDir: true,
      },
    },
  ];
}
