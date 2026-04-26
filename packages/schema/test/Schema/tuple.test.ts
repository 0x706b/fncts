import type { Tuple } from "@fncts/schema/AST";

import { IndexError, MissingError, TupleError, TypeError, UnexpectedError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema tuple", () => {
  test("success", () => {
    const schema = Schema.tuple(Schema.string, Schema.number);

    expectSuccess(schema, ["hello", 42], ["hello", 42]);
  });

  test("success - single element", () => {
    const schema = Schema.tuple(Schema.string);

    expectSuccess(schema, ["hello"], ["hello"]);
  });

  test("success - mixed types", () => {
    const schema = Schema.tuple(Schema.string, Schema.boolean, Schema.number);

    expectSuccess(schema, ["a", true, 1], ["a", true, 1]);
  });

  test("failure - wrong type in element", () => {
    const schema = Schema.tuple(Schema.string, Schema.number);

    expectFailure(
      schema,
      ["hello", "not a number"],
      TupleError(
        schema.ast as Tuple,
        ["hello", "not a number"],
        Vector(IndexError(1, TypeError(AST.numberKeyword, "not a number"))),
        ["hello"],
      ),
    );
  });

  test("failure - multiple wrong elements", () => {
    const schema = Schema.tuple(Schema.string, Schema.number, Schema.boolean);

    expectFailure(
      schema,
      [1, "not a number", "not a boolean"],
      TupleError(
        schema.ast as Tuple,
        [1, "not a number", "not a boolean"],
        Vector(
          IndexError(0, TypeError(AST.stringKeyword, 1)),
          IndexError(1, TypeError(AST.numberKeyword, "not a number")),
          IndexError(2, TypeError(AST.booleanKeyword, "not a boolean")),
        ),
      ),
      { allErrors: true },
    );
  });

  test("failure - not an array", () => {
    const schema = Schema.tuple(Schema.string, Schema.number);

    expectFailure(schema, "not an array", TypeError(AST.unknownArray, "not an array"));
  });

  test("failure - missing element", () => {
    const schema = Schema.tuple(Schema.string, Schema.number);

    expectFailure(
      schema,
      ["hello"],
      TupleError(schema.ast as Tuple, ["hello"], Vector(IndexError(1, new MissingError())), ["hello"]),
    );
  });

  test("failure - extra element", () => {
    const schema = Schema.tuple(Schema.string, Schema.number);

    expectFailure(
      schema,
      ["hello", 42, "extra"],
      TupleError(schema.ast as Tuple, ["hello", 42, "extra"], Vector(IndexError(2, UnexpectedError("extra"))), [
        "hello",
        42,
      ]),
    );
  });
});
