import type { AST, Rule } from "eslint";

import jsYaml from "js-yaml";
import module from "node:module";
import os from "node:os";
import path from "node:path";

const require = module.createRequire(import.meta.url);

export type Preset<A extends Record<string, unknown> = {}> = (
  params: PresetParams<A>,
) => string;

export interface PresetParams<A extends Record<string, unknown> = {}> {
  context: Rule.RuleContext;
  existingContent: string;
  options: A;
}

export const codegen: Rule.RuleModule = {
  meta: {
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          presets: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
        },
      },
    ],
  },
  create: (context) => {
    const presets = context.options[0].presets as Record<string, string>;

    const sourceCode = context.sourceCode.text;

    const supportedExtensions = /\.(m|c)?(j|t)sx?/;

    if (!supportedExtensions.test(path.extname(context.physicalFilename))) {
      throw new Error(`codegen does not support ${context.physicalFilename}`);
    }

    const marker = {
      start: /\/\/ codegen:start ?(.*)/g,
      end: /\/\/ codegen:end/g,
    };

    const position = (index: number) => {
      const stringUpToPosition = sourceCode.slice(0, index);
      const lines              = stringUpToPosition.split(os.EOL);
      return { line: lines.length, column: lines.at(-1)!.length };
    };

    const startMatches = [...sourceCode.matchAll(marker.start)].filter(
      (startMatch) => {
        const prevCharacter = sourceCode[startMatch.index - 1];
        return !prevCharacter || prevCharacter === "\n";
      },
    );

    startMatches.forEach((startMatch, startMatchesIndex) => {
      const startIndex     = startMatch.index!.valueOf();
      const start          = position(startIndex);
      const startMarkerLoc = {
        start,
        end: { ...start, column: start.column + startMatch[0].length },
      };
      const searchForEndMarkerUpTo =
        startMatchesIndex === startMatches.length - 1
          ? sourceCode.length
          : startMatches[startMatchesIndex + 1]!.index;
      const endMatch = [
        ...sourceCode.slice(0, searchForEndMarkerUpTo).matchAll(marker.end),
      ].find((e) => e.index! > startMatch.index!);
      if (!endMatch) {
        const afterStartMatch = startIndex + startMatch[0].length;
        context.report({
          message: `couldn't find end marker (expected regex ${marker.end})`,
          loc: startMarkerLoc,
          fix: (fixer) =>
            fixer.replaceTextRange(
              [afterStartMatch, afterStartMatch],
              os.EOL + marker.end.source.replaceAll("\\", ""),
            ),
        });
        return;
      }

      let options: Record<string, unknown>;

      try {
        options = jsYaml.load(startMatch[1]!) as Record<string, unknown>;
      } catch (e) {
        context.report({
          message: `Error parsing options. ${e}`,
          loc: startMarkerLoc,
        });
        return;
      }

      const presetName = options.preset;

      if (typeof presetName !== "string" || !(presetName in presets)) {
        context.report({
          message: `Unknown preset ${presetName}. Available presets: ${Object.keys(presets).join(", ")}`,
          loc: startMarkerLoc,
        });

        return;
      }

      let preset: Preset;
      try {
        preset = require(presets[presetName]!).default;
      } catch (e) {
        context.report({
          message: `Failed to require preset ${presetName}: ${e}`,
          loc: startMarkerLoc,
        });
        return;
      }

      const range: AST.Range = [
        startIndex + startMatch[0].length + os.EOL.length,
        endMatch.index!,
      ];

      const existingContent = sourceCode.slice(...range);

      let result;

      try {
        result = preset({ context, existingContent, options });
      } catch (e) {
        context.report({
          message: String(e),
          loc: startMarkerLoc,
        });
        return;
      }

      if (normalize(existingContent) !== normalize(result)) {
        const loc = { start: position(range[0]), end: position(range[1]) };
        context.report({
          message:
            "content doesn't match, run autofix to generate expected code",
          loc,
          fix: (fixer) =>
            fixer.replaceTextRange(range, normalize(result) + os.EOL),
        });
      }
    });

    return {};
  },
};

function normalize(val: string) {
  return val.trim().replaceAll(/\r?\n/g, os.EOL);
}
