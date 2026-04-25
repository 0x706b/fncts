import { defineConfig } from "vitest/config";

import { tscPlugin } from "../../plugins/vite-plugin-typescript.js";

export default defineConfig({
  plugins: [tscPlugin({ cwd: import.meta.dirname })],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["test/**/*.test.ts", "build/test/**/*.test.js"],
    experimental: {
      fsModuleCache: true,
    },
  },
});
