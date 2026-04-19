import type { Refinement } from "@fncts/schema/AST";

import { RefinementError, TypeError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema filter", () => {
  test("success", () => {
    const schema = Schema.number.filter((n): n is number => n > 0);

    expectSuccess(schema, 1, 1);
    expectSuccess(schema, 42, 42);
    expectSuccess(schema, 0.5, 0.5);
  });

  test("failure - predicate", () => {
    const schema = Schema.number.filter((n): n is number => n > 0);

    expectFailure(schema, -1, RefinementError(schema.ast as Refinement, -1, "Predicate", TypeError(schema.ast, -1)));

    expectFailure(schema, 0, RefinementError(schema.ast as Refinement, 0, "Predicate", TypeError(schema.ast, 0)));
  });

  test("failure - from", () => {
    const schema = Schema.number.filter((n): n is number => n > 0);

    expectFailure(
      schema,
      "not a number",
      RefinementError(schema.ast as Refinement, "not a number", "From", TypeError(AST.numberKeyword, "not a number")),
    );
  });
});
