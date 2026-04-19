import type { Refinement } from "@fncts/schema/AST";

import { RefinementError, TypeError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema brand", () => {
  test("success", () => {
    const intValidation = Validation((n: number): n is number => Number.isInteger(n), "Integer");
    const schema        = Schema.number.brand(intValidation);

    expectSuccess(schema, 1, 1 as Brand.Type<typeof intValidation>);
    expectSuccess(schema, 42, 42 as Brand.Type<typeof intValidation>);
    expectSuccess(schema, 0, 0 as Brand.Type<typeof intValidation>);
    expectSuccess(schema, -10, -10 as Brand.Type<typeof intValidation>);
  });

  test("failure - validation", () => {
    const intValidation = Validation((n: number): n is number => Number.isInteger(n), "Integer");
    const schema        = Schema.number.brand(intValidation);

    expectFailure(schema, 1.5, RefinementError(schema.ast as Refinement, 1.5, "Predicate", TypeError(schema.ast, 1.5)));
  });

  test("failure - from", () => {
    const intValidation = Validation((n: number): n is number => Number.isInteger(n), "Integer");
    const schema        = Schema.number.brand(intValidation);

    expectFailure(
      schema,
      "not a number",
      RefinementError(schema.ast as Refinement, "not a number", "From", TypeError(AST.numberKeyword, "not a number")),
    );
  });

  test("with string brand", () => {
    const nonEmptyValidation = Validation((s: string): s is string => s.length > 0, "NonEmpty");
    const schema             = Schema.string.brand(nonEmptyValidation);

    expectSuccess(schema, "hello", "hello" as Brand.Type<typeof nonEmptyValidation>);
    expectFailure(schema, "", RefinementError(schema.ast as Refinement, "", "Predicate", TypeError(schema.ast, "")));
  });
});
