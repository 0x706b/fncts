import type { ParseOptions } from "@fncts/schema/AST";

import { assert } from "vitest";

export function expectSuccess<A>(self: Schema<A>, input: unknown, output: A, options?: ParseOptions) {
  self.decode(input, options).match(
    (e) => {
      throw e;
    },
    (a) => {
      assert.deepEqual(a, output);
    },
  );
}

export function expectFailure<A>(self: Schema<A>, input: unknown, expected: ParseError, options?: ParseOptions) {
  self.decode(input, options).match(
    (e) => {
      assert.deepEqual(e, expected);
    },
    (a) => {
      assert.fail(`Expected failure, got ${a}`);
    },
  );
}
