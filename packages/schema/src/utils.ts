import type { IndexSignature, TemplateLiteral } from "./AST";

import { showWithOptions } from "@fncts/base/data/Showable";

import { ASTTag } from "./AST.js";

export function memoize<A, B>(f: (a: A) => B): (a: A) => B {
  const cache = new Map();
  return (a) => {
    if (!cache.has(a)) {
      const b = f(a);
      cache.set(a, b);
      return b;
    }
    return cache.get(a);
  };
}

export function ownKeys(o: object | undefined): Vector<PropertyKey> {
  return o ? Vector.from(Reflect.ownKeys(o)) : Vector.empty();
}

export function getTemplateLiteralRegex(ast: TemplateLiteral): RegExp {
  let pattern = `^${ast.head}`;
  for (const span of ast.spans) {
    if (span.type.isStringKeyword()) {
      pattern += ".*";
    } else if (span.type.isNumberKeyword()) {
      pattern += "-?\\d+(\\.\\d+)?";
    }
    pattern += span.literal;
  }
  pattern += "$";
  return new RegExp(pattern);
}

export function getKeysForIndexSignature(
  input: { readonly [x: PropertyKey]: unknown },
  parameter: IndexSignature["parameter"],
): Vector<string> | Vector<symbol> {
  switch (parameter._tag) {
    case ASTTag.StringKeyword:
    case ASTTag.TemplateLiteral:
      return Vector.from(Object.keys(input));
    case ASTTag.SymbolKeyword:
      return Vector.from(Object.getOwnPropertySymbols(input));
    case ASTTag.Refinement:
      return getKeysForIndexSignature(input, parameter.from as any);
  }
}

export function formatUnknown(u: unknown): string {
  return showWithOptions(u, {});
}
