import baseConfig from "@fncts/eslint-config";
import tseslint from "typescript-eslint";

export default tseslint.config(...baseConfig, {
  files: [
    "src/IO/api.ts",
    "src/Channel/api.ts",
    "src/Stream/api.ts",
    "src/Hub/api.ts",
    "src/Future/api.ts",
    "src/Push/api.ts",
  ],
  rules: {
    "perfectionist/sort-modules": [
      "error",
      {
        type: "natural",
        fallbackSort: {
          type: "alphabetical",
        },
        groups: [
          "unknown",
          "declare-enum",
          "export-enum",
          "enum",
          ["declare-interface", "declare-type"],
          ["export-interface", "export-type"],
          ["interface", "type"],
          "declare-class",
          "export-class",
          ["class", "function"],
        ],
      },
    ],
  },
});
