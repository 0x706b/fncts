import { defineConfig } from "vitest/config";
import os from "node:os";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    experimental: {
      fsModuleCache: true,
    },
    maxWorkers: Math.max(1, Math.min(8, os.availableParallelism() - 1)),
  },
});
