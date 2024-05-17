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
      Vector(
        ParseError.UnionMemberError(Vector(ParseError.TypeError(AST.createLiteral(null), 42))),
        ParseError.UnionMemberError(Vector(ParseError.TypeError(AST.stringKeyword, 42))),
      ),
    );

    expectFailure(
      schema,
      undefined,
      Vector(
        ParseError.UnionMemberError(Vector(ParseError.TypeError(AST.createLiteral(null), undefined))),
        ParseError.UnionMemberError(Vector(ParseError.TypeError(AST.stringKeyword, undefined))),
      ),
    );
  });
});
