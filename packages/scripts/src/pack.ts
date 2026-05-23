import child_process from "child_process";
import fs from "fs/promises";
import { glob } from "glob";
import { posix } from "path";
import { promisify } from "util";

type Mode = "cjs" | "mjs" | "both";

function getMode(): Mode {
  const modeArg = process.argv[2];
  if (!modeArg) {
    return "both";
  }
  if (modeArg !== "cjs" && modeArg !== "mjs" && modeArg !== "both") {
    throw new Error('Invalid mode, must be "cjs" | "mjs" | "both" | undefined');
  }
  return modeArg;
}

const exec = promisify(child_process.exec);

function carry(key: string, root: any, target: any) {
  if (key in root) {
    target[key] = root[key];
  }
}

async function getPackageJson() {
  const content = await fs.readFile("./package.json", { encoding: "utf-8" });
  return JSON.parse(content);
}

async function writePackageJson(mode: "cjs" | "mjs" | "both" = "both") {
  const originalManifest = await getPackageJson();
  const rawManifest: any = {};

  carry("name", originalManifest, rawManifest);
  carry("version", originalManifest, rawManifest);
  carry("private", originalManifest, rawManifest);
  carry("license", originalManifest, rawManifest);
  carry("repository", originalManifest, rawManifest);
  carry("gitHead", originalManifest, rawManifest);
  carry("bin", originalManifest, rawManifest);
  carry("dependencies", originalManifest, rawManifest);
  carry("peerDependencies", originalManifest, rawManifest);
  carry("peerDependenciesMeta", originalManifest, rawManifest);
  carry("optionalDependencies", originalManifest, rawManifest);

  const exports: any = {};
  exports["./*"]     = {};
  exports["."]       = {};

  if (originalManifest?.["exports"]?.["."]?.["types"]) {
    exports["./*"].types = "./*.d.ts";
    exports["."].types   = "./index.d.ts";
  }

  if (mode === "mjs" || mode === "both") {
    exports["./*"].import = "./_mjs/*.mjs";
    exports["."].import   = "./_mjs/index.mjs";
  }
  if (mode === "cjs" || mode === "both") {
    exports["./*"].require = "./_cjs/*.cjs";
    exports["."].require   = "./_cjs/index.cjs";
  }
  rawManifest.exports = exports;

  rawManifest.publishConfig = {
    access: "public",
  };

  const content = JSON.stringify(rawManifest, null, 2);

  await fs.writeFile("./dist/package.json", content);
}

function rewriteSourceMap(content: string, path: string) {
  const dir = posix.dirname(path);
  return JSON.stringify(
    Object.entries(JSON.parse(content))
      .map(([k, v]) =>
        k === "sources"
          ? ([
              k,
              (v as Array<string>).map((source) => {
                if (path.match(/dist\/_(.+)\//)) {
                  source = source.replace(/(.*)\.\.\/src(.*)/gm, "$1_src$2");
                } else {
                  source = source.replace(/(.*)\.\.\/\.\.\/src(.*)/gm, "$1_src$2");
                }
                source = posix.relative(dir, posix.join(dir, source));
                return source.startsWith(".") ? source : "./" + source;
              }),
            ] as const)
          : ([k, v] as const),
      )
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
  );
}

function exists(path: string) {
  return fs.access(path).then(
    () => true,
    () => false,
  );
}

const mode = getMode();

if (await exists("dist")) {
  await exec("rm -rf dist");
}
await fs.mkdir("dist");
if (await exists("./src")) {
  await fs.mkdir("./dist/_src");
  await exec("cp -r ./src/* ./dist/_src");
}
if (await exists("./build/mjs")) {
  await fs.mkdir("./dist/_mjs");
  await exec("cp -r ./build/mjs/* ./dist/_mjs");
}
if (await exists("./build/cjs")) {
  await fs.mkdir("./dist/_cjs");
  await exec("cp -r ./build/cjs/* ./dist/_cjs");
}
if (await exists("./build/dts")) {
  await exec("cp -r ./build/dts/* ./dist");
}

await writePackageJson(mode);

const sourceMapPaths = await glob("dist/**/*.map");

await Promise.all(
  sourceMapPaths.map(async (path) => {
    let content = await fs.readFile(path, { encoding: "utf-8" });
    content     = rewriteSourceMap(content, path);
    await fs.writeFile(path, content);
  }),
);

console.log("Done!");
