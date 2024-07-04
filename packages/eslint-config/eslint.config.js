import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import { legacyPlugin } from "@fncts/eslint-config/legacyPlugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: dirname,
  recommendedConfig: eslint.configs.recommended,
});

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  plugins: {
    import: legacyPlugin(compat, "eslint-plugin-import", "import"),
    "simple-import-sort": legacyPlugin(compat, "eslint-plugin-simple-import-sort", "simple-import-sort"),
    codegen: legacyPlugin(compat, "eslint-plugin-codegen", "codegen"),
    "@0x706b/align-assignments": legacyPlugin(
      compat,
      "@0x706b/eslint-plugin-align-assignments",
      "@0x706b/align-assignments",
    ),
    "@0x706b/module-specifier-extensions": legacyPlugin(
      compat,
      "@0x706b/eslint-plugin-module-specifier-extensions",
      "@0x706b/module-specifier-extensions",
    ),
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: `${dirname}/../config/tsconfig.base.json`,
      },
    },
  },
  rules: {
    "@0x706b/align-assignments/align-assignments": "error",
    "@0x706b/module-specifier-extensions/module-specifier-extensions": [
      "error",
      {
        remove: ["^@fncts.*$"],
      },
    ],
    "@typescript-eslint/consistent-type-imports": "warn",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-this-alias": "off",
    quotes: ["warn", "double", { avoidEscape: true }],
    "@typescript-eslint/semi": ["warn", "always"],
    "simple-import-sort/exports": "warn",
    "simple-import-sort/imports": [
      "warn",
      {
        groups: [["^.*\\u0000$"], ["^\\u0000"], ["^@?\\w"], ["^"], ["^\\."]],
      },
    ],
    "codegen/codegen": [
      "error",
      {
        presets: {
          pipeable: "@fncts/codegen/pipeable",
          barrel: "@fncts/codegen/barrel",
          "type-barrel": "@fncts/codegen/type-barrel",
        },
      },
    ],
    "import/order": "off",
    "import/no-unresolved": "error",

    "no-case-declarations": "off",
    "no-empty": "off",
    "no-unexpected-multiline": "off",
    "no-fallthrough": "off",
    "no-control-regex": "off",
    "no-prototype-builtins": "off",
  },
});
