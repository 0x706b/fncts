import { fixupPluginRules } from "@eslint/compat";

/**
 * @param {import("@eslint/eslintrc").FlatCompat} compat FlatCompat instance
 * @param {string} name the pugin name
 * @param {string} alias the plugin alias
 * @returns {import("eslint").ESLint.Plugin}
 */
export function legacyPlugin(compat, name, alias = name) {
  const plugin = compat
    .plugins(name)
    .find((config) => config.plugins?.[alias] !== undefined)?.plugins?.[alias];

  if (!plugin) {
    throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
  }

  return fixupPluginRules(plugin);
}
