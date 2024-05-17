import type { ParseOptions } from "@fncts/schema/AST";

import { assert } from "vitest";

export function expectSuccess<A>(self: Schema<A>, input: unknown, output: A, options?: ParseOptions) {
  self.decode(input, options).match({
    Left: (e) => {
      throw e;
    },
    Right: (a) => {
      assert.deepEqual(a, output);
    },
  });
}

export function expectFailure<A>(
  self: Schema<A>,
  input: unknown,
  expected: Vector<ParseError>,
  options?: ParseOptions,
) {
  self.decode(input, options).match({
    Left: (e) => {
      assert.deepEqual(e.errors, expected);
    },
    Right: (a) => {
      assert.fail(`Expected failure, got ${a}`);
    },
  });
}
