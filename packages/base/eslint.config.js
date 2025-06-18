import baseConfig from "@fncts/eslint-config";
import tseslint from "typescript-eslint";

export default tseslint.config(...baseConfig, {
  files: [
    "src/data/Maybe/api.ts",
    "src/data/Maybe/constructors.ts",
    "src/data/Either/api.ts",
    "src/data/Either/constructors.ts",
    "src/data/Datum/api.ts",
    "src/data/DatumEither/api.ts",
    "src/data/EitherT/api.ts",
    "src/data/Exit/api.ts",
    "src/data/These/api.ts",
    "src/collection/Iterable/api.ts",
    "src/collection/immutable/ImmutableArray/api.ts",
    // "src/collection/immutable/List/api.ts",
  ],
  rules: {
    "perfectionist/sort-modules": [
      "error",
      {
        type: "natural",
        groups: [
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
