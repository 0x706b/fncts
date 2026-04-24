import { MissingError, TypeError, UnexpectedError } from "@fncts/schema/ParseError";
import { assert } from "vitest";

function expectEqual(left: unknown, right: unknown) {
  assert.isTrue(Equatable.strictEquals(left, right));
  assert.isTrue(Equatable.deepEquals(left, right));
}

function expectNotEqual(left: unknown, right: unknown) {
  assert.isFalse(Equatable.strictEquals(left, right));
  assert.isFalse(Equatable.deepEquals(left, right));
}

suite("ParseError structural equality", () => {
  test("equal primitive parse errors", () => {
    expectEqual(new TypeError(AST.stringKeyword, "a"), new TypeError(AST.stringKeyword, "a"));
    expectEqual(new MissingError(), new MissingError());
    expectEqual(new UnexpectedError(1), new UnexpectedError(1));
  });

  test("unequal parse errors with different content", () => {
    expectNotEqual(ParseError.TypeError(AST.stringKeyword, "a"), ParseError.TypeError(AST.stringKeyword, "b"));
    expectNotEqual(ParseError.TypeError(AST.stringKeyword, "a"), ParseError.UnexpectedError("a"));
  });

  test("equal nested parse errors", () => {
    const left = ParseError.TupleError(
      AST.createTuple(
        Vector(AST.createElement(AST.stringKeyword, false), AST.createElement(AST.numberKeyword, false)),
        Nothing(),
        true,
      ),
      ["a", "b"],
      Vector(
        ParseError.IndexError(1, ParseError.TypeError(AST.numberKeyword, "b")),
        ParseError.IndexError(2, ParseError.MissingError),
      ),
      ["a"],
    );
    const right = ParseError.TupleError(
      AST.createTuple(
        Vector(AST.createElement(AST.stringKeyword, false), AST.createElement(AST.numberKeyword, false)),
        Nothing(),
        true,
      ),
      ["a", "b"],
      Vector(
        ParseError.IndexError(1, ParseError.TypeError(AST.numberKeyword, "b")),
        ParseError.IndexError(2, new MissingError()),
      ),
      ["a"],
    );

    assert.isFalse(Equatable.strictEquals(left, right));
    assert.isTrue(Equatable.deepEquals(left, right));
  });

  test("nested parse errors are unequal when child content differs", () => {
    expectNotEqual(
      ParseError.UnionMemberError(AST.stringKeyword, ParseError.TypeError(AST.stringKeyword, "a")),
      ParseError.UnionMemberError(AST.stringKeyword, ParseError.TypeError(AST.stringKeyword, "b")),
    );
  });

  test("plain object payloads stay reference-based under strictEquals", () => {
    const left = ParseError.TypeLiteralError(
      AST.createTypeLiteral(Vector(AST.createPropertySignature("a", AST.stringKeyword, false, true)), Vector.empty()),
      { a: 1 },
      Vector(ParseError.KeyError(AST.createLiteral("a"), "a", ParseError.TypeError(AST.stringKeyword, 1))),
      { a: 1 },
    );
    const right = ParseError.TypeLiteralError(
      AST.createTypeLiteral(Vector(AST.createPropertySignature("a", AST.stringKeyword, false, true)), Vector.empty()),
      { a: 1 },
      Vector(ParseError.KeyError(AST.createLiteral("a"), "a", ParseError.TypeError(AST.stringKeyword, 1))),
      { a: 1 },
    );

    assert.isFalse(Equatable.strictEquals(left, right));
    assert.isTrue(Equatable.deepEquals(left, right));
  });
});
