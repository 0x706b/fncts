import type { ViteUserConfig } from "vitest/config";

import { aliases } from "@fncts/config/vitest-aliases";
import { defineConfig, mergeConfig } from "vitest/config";

import { tscPlugin } from "../../plugins/vite-plugin-typescript.js";

const ci = !!process.env.CI;

export default defineConfig(() => {
  const commonConfig: ViteUserConfig = {
    plugins: [tscPlugin({ cwd: import.meta.dirname })],
  };

  if (ci) {
    return mergeConfig(commonConfig, {
      test: {
        include: ["build/test/**/*.test.js"],
      },
    });
  }

  return mergeConfig(commonConfig, {
    resolve: {
      alias: aliases,
    },
    test: {
      include: ["test/**/*.test.ts"],
    },
  } satisfies ViteUserConfig);
});
