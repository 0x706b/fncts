import type { TypeLiteral } from "@fncts/schema/AST";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Record Schema", () => {
  test("success", () => {
    const schema = Schema.record(Schema.string, Schema.string);

    expectSuccess(schema, { a: "a", b: "b" }, { a: "a", b: "b" });
  });

  test("failure", () => {
    const schema = Schema.record(Schema.string, Schema.string);

    expectFailure(
      schema,
      { a: 1, b: 2 },
      ParseError.TypeLiteralError(
        schema.ast as TypeLiteral,
        { a: 1, b: 2 },
        Vector(
          ParseError.KeyError(AST.createLiteral("a"), "a", ParseError.TypeError(AST.stringKeyword, 1)),
          ParseError.KeyError(AST.createLiteral("b"), "b", ParseError.TypeError(AST.stringKeyword, 2)),
        ),
      ),
      { allErrors: true },
    );
  });
});
