import type { Union } from "@fncts/schema/AST";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Nullable Schema", () => {
  test("success", () => {
    const schema = Schema.string.nullable;

    expectSuccess(schema, "hello", "hello");
    expectSuccess(schema, null, null);
  });

  test("failure", () => {
    const schema = Schema.string.nullable;

    expectFailure(
      schema,
      42,
      ParseError.UnionError(
        schema.ast as Union,
        42,
        Vector(
          ParseError.UnionMemberError(AST.createLiteral(null), ParseError.TypeError(AST.createLiteral(null), 42)),
          ParseError.UnionMemberError(AST.stringKeyword, ParseError.TypeError(AST.stringKeyword, 42)),
        ),
      ),
    );

    expectFailure(
      schema,
      undefined,
      ParseError.UnionError(
        schema.ast as Union,
        undefined,
        Vector(
          ParseError.UnionMemberError(
            AST.createLiteral(null),
            ParseError.TypeError(AST.createLiteral(null), undefined),
          ),
          ParseError.UnionMemberError(AST.stringKeyword, ParseError.TypeError(AST.stringKeyword, undefined)),
        ),
      ),
    );
  });
});
