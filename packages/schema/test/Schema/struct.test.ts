import { expectFailure, expectSuccess } from "../utils.js";

suite("Struct Schema", () => {
  test("success", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string,
    });

    expectSuccess(schema, { a: 42, b: "hello" }, { a: 42, b: "hello" });

    expectSuccess(schema, { a: 42, b: "hello", c: "unexpected" }, { a: 42, b: "hello" }, { isUnexpectedAllowed: true });
  });

  test("failure", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string,
    });

    expectFailure(
      schema,
      { a: 42, b: 42 },
      Vector(ParseError.KeyError(AST.createLiteral("b"), "b", Vector(ParseError.TypeError(AST.stringKeyword, 42)))),
    );

    expectFailure(schema, 42, Vector(ParseError.TypeError(AST.unknownRecord, 42)));

    expectFailure(
      schema,
      { a: 42, b: "hello", c: "unexpected" },
      Vector(ParseError.KeyError(AST.createLiteral("c"), "c", Vector(ParseError.UnexpectedError("unexpected")))),
    );
  });
});
