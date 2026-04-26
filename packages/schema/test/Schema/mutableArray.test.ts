import type { Tuple } from "@fncts/schema/AST";

import { IndexError, TupleError, TypeError } from "@fncts/schema/ParseError";
import { assert } from "vitest";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema mutableArray", () => {
  test("success", () => {
    const schema = Schema.mutableArray(Schema.string);

    expectSuccess(schema, ["a", "b", "c"], ["a", "b", "c"]);
  });

  test("success - empty array", () => {
    const schema = Schema.mutableArray(Schema.number);

    expectSuccess(schema, [], []);
  });

  test("failure - not an array", () => {
    const schema = Schema.mutableArray(Schema.string);

    expectFailure(schema, "not an array", TypeError(AST.unknownArray, "not an array"));
  });

  test("failure - wrong element type", () => {
    const schema = Schema.mutableArray(Schema.number);

    expectFailure(
      schema,
      [1, "two", 3],
      TupleError(schema.ast as Tuple, [1, "two", 3], Vector(IndexError(1, TypeError(AST.numberKeyword, "two"))), [1]),
    );
  });

  test("returns mutable array", () => {
    const schema = Schema.mutableArray(Schema.number);

    const result = schema.decode([1, 2, 3]).match(
      () => {
        throw new Error("should succeed");
      },
      (a) => a,
    );

    assert.isTrue(Array.isArray(result));
  });
});
