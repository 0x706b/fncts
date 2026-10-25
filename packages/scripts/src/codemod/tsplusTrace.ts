import type * as BabelCore from "@babel/core";
import type { PluginObject } from "@babel/core";

import * as t from "@babel/types";

export type Babel = typeof BabelCore;

export default function tsplusTrace(_: Babel): PluginObject {
  return {
    visitor: {
      FunctionDeclaration({ node }) {
        if (node.id != null && node.id.name.includes("concrete")) {
          return;
        }
        if (!node.params.find((value) => t.isIdentifier(value) && value.name === "__tsplusTrace")) {
          const identifier          = t.identifier("__tsplusTrace");
          identifier.optional       = true;
          identifier.typeAnnotation = t.tsTypeAnnotation(t.tsStringKeyword());
          node.params.push(identifier);
        }
      },
    },
  };
}
