import path from "node:path";

const projectDir = path.resolve(import.meta.dirname, "..", "..");

const packages = [
  "base",
  "cache",
  "express",
  "http",
  "io",
  "node",
  "observable",
  "pattern",
  "query",
  "react",
  "schema",
  "scripts",
  "test",
  "transformers",
  "typelevel",
];

export const aliases = packages.flatMap((name) => [
  {
    find: RegExp(`^@fncts\/${name}$`),
    replacement: path.resolve(projectDir, "packages", name, "src", "index.ts"),
  },
  {
    find: RegExp(`^@fncts\/${name}\/(.*)$`),
    replacement: path.resolve(projectDir, "packages", name, "src", "$1"),
  },
]);
