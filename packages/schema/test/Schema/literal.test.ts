import type { Literal, Union } from "@fncts/schema/AST";

import { TypeError, UnionError, UnionMemberError } from "@fncts/schema/ParseError";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema literal", () => {
  test("success - single literal", () => {
    const schema = Schema.literal("hello");

    expectSuccess(schema, "hello", "hello");
  });

  test("success - multiple literals", () => {
    const schema = Schema.literal("a", "b", "c");

    expectSuccess(schema, "a", "a");
    expectSuccess(schema, "b", "b");
    expectSuccess(schema, "c", "c");
  });

  test("success - numeric literals", () => {
    const schema = Schema.literal(1, 2, 3);

    expectSuccess(schema, 1, 1);
    expectSuccess(schema, 2, 2);
    expectSuccess(schema, 3, 3);
  });

  test("success - mixed literals", () => {
    const schema = Schema.literal("a", 1, true, null);

    expectSuccess(schema, "a", "a");
    expectSuccess(schema, 1, 1);
    expectSuccess(schema, true, true);
    expectSuccess(schema, null, null);
  });

  test("failure - wrong value", () => {
    const schema = Schema.literal("a", "b");

    expectFailure(
      schema,
      "c",
      UnionError(
        schema.ast as Union,
        "c",
        Vector(
          UnionMemberError(AST.createLiteral("a"), TypeError(AST.createLiteral("a"), "c")),
          UnionMemberError(AST.createLiteral("b"), TypeError(AST.createLiteral("b"), "c")),
        ),
      ),
    );
  });

  test("failure - wrong type", () => {
    const schema = Schema.literal("a", "b");

    expectFailure(
      schema,
      42,
      UnionError(
        schema.ast as Union,
        42,
        Vector(
          UnionMemberError(AST.createLiteral("a"), TypeError(AST.createLiteral("a"), 42)),
          UnionMemberError(AST.createLiteral("b"), TypeError(AST.createLiteral("b"), 42)),
        ),
      ),
    );
  });

  test("failure - null vs undefined", () => {
    const schema = Schema.literal(null);

    expectFailure(schema, undefined, TypeError(AST.createLiteral(null), undefined));
  });
});
