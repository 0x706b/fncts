const { execSync } = require("node:child_process");

execSync("npx changeset version");
execSync("YARN_ENABLE_IMMUTABLE_INSTALLS=false node .yarn/releases/yarn-4.5.0.cjs");
