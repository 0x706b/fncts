const { execSync } = require("node:child_process");

execSync("pnpm exec changeset version");
execSync("pnpm install --no-frozen-lockfile");
