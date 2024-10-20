import type { Refinement } from "@fncts/schema/AST";

import { RefinementError, TypeError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema Primitives", () => {
  test("never", () => {
    const schema = Schema.never;
    expectFailure(schema, 1, TypeError(schema.ast, 1));
  });

  test("number", () => {
    const schema = Schema.number;
    expectSuccess(schema, 1, 1);
    expectFailure(schema, "a", TypeError(schema.ast, "a"));
  });

  test("string", () => {
    const schema = Schema.string;
    expectSuccess(schema, "hello", "hello");
    expectFailure(schema, 1, TypeError(schema.ast, 1));
  });

  test("boolean", () => {
    const schema = Schema.boolean;
    expectSuccess(schema, true, true);
    expectSuccess(schema, false, false);
    expectFailure(schema, 1, TypeError(schema.ast, 1));
    expectFailure(schema, 0, TypeError(schema.ast, 0));
  });

  test("bigint", () => {
    const schema = Schema.bigint;
    expectSuccess(schema, 1n, 1n);
    expectSuccess(schema, BigInt(1), BigInt(1));
    expectFailure(schema, 1, TypeError(schema.ast, 1));
  });

  test("any", () => {
    const schema = Schema.any;
    expectSuccess(schema, 42, 42);
  });

  test("unknown", () => {
    const schema = Schema.unknown;
    expectSuccess(schema, 42, 42);
  });

  test("undefined", () => {
    const schema = Schema.undefined;
    expectSuccess(schema, undefined, undefined);
    expectFailure(schema, null, TypeError(schema.ast, null));
    expectFailure(schema, 42, TypeError(schema.ast, 42));
    expectFailure(schema, {}, TypeError(schema.ast, {}));
  });

  test("null", () => {
    const schema = Schema.null;
    expectSuccess(schema, null, null);
    expectFailure(schema, undefined, TypeError(schema.ast, undefined));
    expectFailure(schema, 42, TypeError(schema.ast, 42));
    expectFailure(schema, {}, TypeError(schema.ast, {}));
  });

  test("symbol", () => {
    const schema = Schema.symbol;
    const symbol = Symbol();
    expectSuccess(schema, symbol, symbol);
    expectFailure(schema, "symbol", TypeError(schema.ast, "symbol"));
  });

  test("object", () => {
    const schema = Schema.object;
    expectSuccess(schema, {}, {});
    expectSuccess(schema, { a: 1 }, { a: 1 });
    expectFailure(schema, null, TypeError(schema.ast, null));
    expectFailure(schema, undefined, TypeError(schema.ast, undefined));
    expectFailure(schema, 42, TypeError(schema.ast, 42));
  });

  test("date", () => {
    const schema = Schema.date;
    const date   = new Date();
    expectSuccess(schema, date, date);
    expectFailure(
      schema,
      date.toISOString(),
      RefinementError(
        schema.ast as Refinement,
        date.toISOString(),
        "From",
        TypeError(schema.ast.getFrom, date.toISOString()),
      ),
    );
    expectFailure(schema, {}, RefinementError(schema.ast as Refinement, {}, "Predicate", TypeError(schema.ast, {})));
  });
});
