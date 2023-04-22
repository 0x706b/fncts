import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/build/test/**/*.{test,spec}.js"],
  }
});
