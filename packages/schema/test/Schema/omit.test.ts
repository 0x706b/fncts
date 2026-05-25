import type { TypeLiteral } from "@fncts/schema/AST";

import { KeyError, MissingError, TypeError, TypeLiteralError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema omit", () => {
  test("success", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string,
      c: Schema.boolean,
    }).omit("b");

    expectSuccess(schema, { a: 42, c: true }, { a: 42, c: true });
  });

  test("success - omit single key", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string,
    }).omit("b");

    expectSuccess(schema, { a: 42 }, { a: 42 });
  });

  test("success - omit multiple keys", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string,
      c: Schema.boolean,
    }).omit("b", "c");

    expectSuccess(schema, { a: 42 }, { a: 42 });
  });

  test("failure - wrong type in remaining field", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string,
      c: Schema.boolean,
    }).omit("b");

    expectFailure(
      schema,
      { a: "not a number", c: true },
      TypeLiteralError(
        schema.ast as TypeLiteral,
        { a: "not a number", c: true },
        Vector(KeyError(AST.createLiteral("a"), "a", TypeError(AST.numberKeyword, "not a number"))),
        { c: true },
      ),
    );
  });

  test("failure - missing required field", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string,
    }).omit("b");

    expectFailure(
      schema,
      {},
      TypeLiteralError(
        schema.ast as TypeLiteral,
        {},
        Vector(KeyError(AST.createLiteral("a"), "a", new MissingError())),
      ),
    );
  });

  test("ignores extra fields in input", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string,
    }).omit("b");

    expectSuccess(schema, { a: 42, c: "extra" }, { a: 42 }, { isUnexpectedAllowed: true });
  });
});
