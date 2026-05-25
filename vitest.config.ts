import os from "node:os";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  test: {
    projects: ["packages/*"],
    experimental: {
      fsModuleCache: true,
    },
    maxWorkers: Math.max(1, Math.min(8, os.availableParallelism() - 1)),
    pool: "threads",
  },
});
