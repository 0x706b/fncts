import type { TypeLiteral, Union } from "@fncts/schema/AST";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Union Schema", () => {
  test("success", () => {
    const schema = Schema.union(Schema.struct({ a: Schema.number }), Schema.struct({ b: Schema.string }));

    expectSuccess(schema, { a: 1 }, { a: 1 });
    expectSuccess(schema, { b: "hello" }, { b: "hello" });
  });

  test("failure", () => {
    const schemaA = Schema.struct({ a: Schema.number });
    const schemaB = Schema.struct({ b: Schema.string });
    const schema  = Schema.union(schemaA, schemaB);

    expectFailure(
      schema,
      { b: 1 },
      ParseError.UnionError(
        schema.ast as Union,
        { b: 1 },
        Vector(
          ParseError.UnionMemberError(
            schemaA.ast,
            ParseError.TypeLiteralError(
              schemaA.ast as TypeLiteral,
              { b: 1 },
              Vector(
                ParseError.KeyError(AST.createLiteral("a"), "a", ParseError.MissingError),
                ParseError.KeyError(AST.createLiteral("b"), "b", ParseError.UnexpectedError(1)),
              ),
            ),
          ),
          ParseError.UnionMemberError(
            schemaB.ast,
            ParseError.TypeLiteralError(
              schemaB.ast as TypeLiteral,
              { b: 1 },
              Vector(ParseError.KeyError(AST.createLiteral("b"), "b", ParseError.TypeError(AST.stringKeyword, 1))),
            ),
          ),
        ),
      ),
      { allErrors: true },
    );
  });
});
