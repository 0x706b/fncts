import { defineConfig } from "vitest/config";

import { tscPlugin } from "../../plugins/vite-plugin-typescript.js";

export default defineConfig({
  plugins: [tscPlugin({ cwd: import.meta.dirname })],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
