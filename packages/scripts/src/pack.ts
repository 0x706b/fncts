import type { Workspace } from "@yarnpkg/core";

import { getPluginConfiguration } from "@yarnpkg/cli";
import { Configuration, Project, structUtils } from "@yarnpkg/core";
import { ppath } from "@yarnpkg/fslib";
import child_process from "child_process";
import fs from "fs/promises";
import glob from "glob";
import { posix } from "path";
import { promisify } from "util";

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

const DEPENDENCY_TYPE = ["dependencies", "peerDependencies"];

const WORKSPACE_PROTOCOL = "workspace:";

async function writePackageJson(project: Project, workspace: Workspace) {
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

  for (const dependencyType of DEPENDENCY_TYPE) {
    for (const descriptor of workspace.manifest.getForScope(dependencyType).values()) {
      const matchingWorkspace = project.tryWorkspaceByDescriptor(descriptor);
      const range             = structUtils.parseRange(descriptor.range);
      if (range.protocol !== WORKSPACE_PROTOCOL) {
        continue;
      }

      if (matchingWorkspace === null) {
        if (project.tryWorkspaceByIdent(descriptor) === null) {
          throw new Error(`Workspace not found: ${structUtils.prettyDescriptor(project.configuration, descriptor)}`);
        }
      } else {
        let versionToWrite: string;
        if (
          structUtils.areDescriptorsEqual(descriptor, matchingWorkspace.anchoredDescriptor) ||
          range.selector === "*"
        ) {
          versionToWrite = matchingWorkspace.manifest.version ?? "0.0.0";
        } else if (range.selector === "~" || range.selector === "^") {
          versionToWrite = `${range.selector}${matchingWorkspace.manifest.version ?? "0.0.0"}`;
        } else {
          versionToWrite = range.selector;
        }
        const identDescriptor =
          dependencyType === "dependencies" ? structUtils.makeDescriptor(descriptor, "unknown") : null;
        const finalDependencyType =
          identDescriptor !== null && workspace.manifest.ensureDependencyMeta(identDescriptor).optional
            ? "optionalDependencies"
            : dependencyType;

        rawManifest[finalDependencyType][structUtils.stringifyIdent(descriptor)] = versionToWrite;
      }
    }
  }

  const exports: any = {};
  exports["./*"]     = {
    import: "./_mjs/*.mjs",
    require: "./_cjs/*.cjs",
  };
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

function getGlob(g: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(g, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

const cwd = ppath.cwd();

const yarnConfiguration = await Configuration.find(cwd, getPluginConfiguration());

const { project } = await Project.find(yarnConfiguration, cwd);

const workspace = project.getWorkspaceByCwd(cwd);

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

await writePackageJson(project, workspace);

const sourceMapPaths = await getGlob("dist/**/*.map");

await Promise.all(
  sourceMapPaths.map(async (path) => {
    let content = await fs.readFile(path, { encoding: "utf-8" });
    content     = rewriteSourceMap(content, path);
    await fs.writeFile(path, content);
  }),
);

console.log("Done!");
