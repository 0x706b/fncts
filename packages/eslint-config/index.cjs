module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ["plugin:@typescript-eslint/recommended"],
  plugins: [
    "@0x706b/align-assignments",
    "import",
    "simple-import-sort",
    "@typescript-eslint",
    "codegen",
  ],
  ignorePatterns: ["dist/", "build/"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    "@0x706b/align-assignments/align-assignments": "error",
    "@typescript-eslint/consistent-type-imports": "warn",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-namespace": "off",
    quotes: ["warn", "double", { avoidEscape: true }],
    "@typescript-eslint/semi": ["warn", "always"],
    "simple-import-sort/exports": "warn",
    "simple-import-sort/imports": [
      "warn",
      { groups: [["^.*\\u0000$"], ["^\\u0000"], ["^@?\\w"], ["^"], ["^\\."]] },
    ],
    "import/first": "error",
    "import/no-duplicates": "error",
    "import/no-unresolved": "error",
    "import/order": "off",
    "codegen/codegen": [
      "error",
      { presets: require("../codegen/build/cjs/autoPipe") },
    ],
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"]
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true
      }
    }
  }
};
