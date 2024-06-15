import type { Tuple } from "@fncts/schema/AST";

import { IndexError, TupleError, TypeError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Array Schema", () => {
  test("success", () => {
    const schema = Schema.string.array;
    expectSuccess(schema, ["a", "b", "c"], ["a", "b", "c"]);
  });
  test("failure", () => {
    const schema = Schema.string.array;

    expectFailure(schema, 0, TypeError(AST.unknownArray, 0));

    expectFailure(
      schema,
      [1, 2, 3],
      TupleError(
        schema.ast as Tuple,
        [1, 2, 3],
        Vector(
          IndexError(0, TypeError(AST.stringKeyword, 1)),
          IndexError(1, TypeError(AST.stringKeyword, 2)),
          IndexError(2, TypeError(AST.stringKeyword, 3)),
        ),
      ),
      { allErrors: true },
    );
  });
});
