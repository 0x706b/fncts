import type { TypeLiteral, Union } from "@fncts/schema/AST";

import { KeyError,TypeError, TypeLiteralError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema extend", () => {
  test("success", () => {
    const base = Schema.struct({
      a: Schema.number,
    });
    const schema = base.extend(Schema.struct({ b: Schema.string }));

    expectSuccess(schema, { a: 42, b: "hello" }, { a: 42, b: "hello" });
  });

  test("success - multiple extensions", () => {
    const base   = Schema.struct({ a: Schema.number });
    const schema = base.extend(Schema.struct({ b: Schema.string })).extend(Schema.struct({ c: Schema.boolean }));

    expectSuccess(schema, { a: 1, b: "x", c: true }, { a: 1, b: "x", c: true });
  });

  test("failure - wrong type in extended field", () => {
    const base   = Schema.struct({ a: Schema.number });
    const schema = base.extend(Schema.struct({ b: Schema.string }));

    expectFailure(
      schema,
      { a: 42, b: 123 },
      TypeLiteralError(
        schema.ast as TypeLiteral,
        { a: 42, b: 123 },
        Vector(KeyError(AST.createLiteral("b"), "b", TypeError(AST.stringKeyword, 123))),
        { a: 42 },
      ),
    );
  });

  test("failure - missing required field", () => {
    const base   = Schema.struct({ a: Schema.number });
    const schema = base.extend(Schema.struct({ b: Schema.string }));

    expectFailure(
      schema,
      { a: 42 },
      TypeLiteralError(
        schema.ast as TypeLiteral,
        { a: 42 },
        Vector(KeyError(AST.createLiteral("b"), "b", ParseError.MissingError)),
        { a: 42 },
      ),
    );
  });

  test("failure - not an object", () => {
    const base   = Schema.struct({ a: Schema.number });
    const schema = base.extend(Schema.struct({ b: Schema.string }));

    expectFailure(schema, 42, TypeError(AST.unknownRecord, 42));
  });
});
