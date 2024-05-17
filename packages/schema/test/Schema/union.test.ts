import { expectFailure, expectSuccess } from "../utils.js";

suite("Union Schema", () => {
  test("success", () => {
    const schema = Schema.union(Schema.struct({ a: Schema.number }), Schema.struct({ b: Schema.string }));

    expectSuccess(schema, { a: 1 }, { a: 1 });
    expectSuccess(schema, { b: "hello" }, { b: "hello" });
  });

  test("failure", () => {
    const schema = Schema.union(Schema.struct({ a: Schema.number }), Schema.struct({ b: Schema.string }));

    expectFailure(
      schema,
      { b: 1 },
      Vector(
        ParseError.UnionMemberError(
          Vector(
            ParseError.KeyError(AST.createLiteral("a"), "a", Vector(ParseError.MissingError)),
            ParseError.KeyError(AST.createLiteral("b"), "b", Vector(ParseError.UnexpectedError(1))),
          ),
        ),
        ParseError.UnionMemberError(
          Vector(ParseError.KeyError(AST.createLiteral("b"), "b", Vector(ParseError.TypeError(AST.stringKeyword, 1)))),
        ),
      ),
      { allErrors: true },
    );
  });
});
