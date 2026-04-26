import type { Transform } from "@fncts/schema/AST";

import { TransformationError, TypeError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema transformOrFail", () => {
  test("success - decode", () => {
    const schema = Schema.string.transformOrFail(
      Schema.number,
      (s) => {
        const n = parseInt(s, 10);
        if (isNaN(n)) return ParseResult.fail(TypeError(AST.numberKeyword, s));
        return ParseResult.succeed(n);
      },
      (n) => ParseResult.succeed(String(n)),
    );

    expectSuccess(schema, "42", 42);
    expectSuccess(schema, "0", 0);
  });

  test("success - encode", () => {
    const schema = Schema.string.transformOrFail(
      Schema.number,
      (s) => {
        const n = parseInt(s, 10);
        if (isNaN(n)) return ParseResult.fail(TypeError(AST.numberKeyword, s));
        return ParseResult.succeed(n);
      },
      (n) => ParseResult.succeed(String(n)),
    );

    expectSuccess(schema, "42", 42);
  });

  test("failure - decode returns error", () => {
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

  test("failure - from side", () => {
    const schema = Schema.string.transformOrFail(
      Schema.number,
      (s) => ParseResult.succeed(parseInt(s, 10)),
      (n) => ParseResult.succeed(String(n)),
    );

    expectFailure(
      schema,
      42,
      TransformationError(schema.ast as Transform, 42, "Encoded", TypeError(AST.stringKeyword, 42)),
    );
  });

  test("failure - to side validation", () => {
    const schema = Schema.string.transformOrFail(
      Schema.number,
      (s) => {
        const n = parseInt(s, 10);
        if (n < 0) return ParseResult.fail(TypeError(AST.numberKeyword, n));
        return ParseResult.succeed(n);
      },
      (n) => ParseResult.succeed(String(n)),
    );

    expectFailure(
      schema,
      "-5",
      TransformationError(schema.ast as Transform, "-5", "Transformation", TypeError(AST.numberKeyword, -5)),
    );
  });

  test("with complex transformation", () => {
    const schema = Schema.struct({
      firstName: Schema.string,
      lastName: Schema.string,
    }).transformOrFail(
      Schema.struct({
        fullName: Schema.string,
      }),
      (input) => {
        if (input.firstName.length === 0) {
          return ParseResult.fail(TypeError(AST.stringKeyword, input.firstName));
        }
        return ParseResult.succeed({ fullName: `${input.firstName} ${input.lastName}` });
      },
      (input) => {
        const parts = input.fullName.split(" ");
        if (parts.length < 2) {
          return ParseResult.fail(TypeError(AST.stringKeyword, input.fullName));
        }
        return ParseResult.succeed({ firstName: parts[0]!, lastName: parts.slice(1).join(" ") });
      },
    );

    expectSuccess(schema, { firstName: "John", lastName: "Doe" }, { fullName: "John Doe" });
  });
});
