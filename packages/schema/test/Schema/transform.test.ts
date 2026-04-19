import type { Transform } from "@fncts/schema/AST";

import { TransformationError, TypeError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema transform", () => {
  test("success - decode", () => {
    const schema = Schema.string.transform(
      Schema.number,
      (s) => parseInt(s, 10),
      (n) => String(n),
    );

    expectSuccess(schema, "42", 42);
    expectSuccess(schema, "0", 0);
    expectSuccess(schema, "-5", -5);
  });

  test("success - encode", () => {
    const schema = Schema.string.transform(
      Schema.number,
      (s) => parseInt(s, 10),
      (n) => String(n),
    );

    expectSuccess(schema, "42", 42);
  });

  test("failure - from side", () => {
    const schema = Schema.string.transform(
      Schema.number,
      (s) => parseInt(s, 10),
      (n) => String(n),
    );

    expectFailure(
      schema,
      42,
      TransformationError(schema.ast as Transform, 42, "Encoded", TypeError(AST.stringKeyword, 42)),
    );
  });

  test("failure - to side", () => {
    const schema = Schema.string.transformOrFail(
      Schema.number,
      (s) => {
        const n = parseInt(s, 10);
        if (isNaN(n)) return ParseResult.fail(TypeError(AST.numberKeyword, s));
        return ParseResult.succeed(n);
      },
      (n) => ParseResult.succeed(String(n)),
    );

    expectFailure(
      schema,
      "not a number",
      TransformationError(
        schema.ast as Transform,
        "not a number",
        "Transformation",
        TypeError(AST.numberKeyword, "not a number"),
      ),
    );
  });

  test("chained transforms", () => {
    const stringToNumber = Schema.string.transform(
      Schema.number,
      (s) => parseInt(s, 10),
      (n) => String(n),
    );
    const schema = stringToNumber.transform(
      Schema.string,
      (n) => `num:${n}`,
      (s) => parseInt(s.replace("num:", ""), 10),
    );

    expectSuccess(schema, "42", "num:42");
  });
});
