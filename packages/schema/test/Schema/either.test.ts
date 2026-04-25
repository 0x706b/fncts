import type { Declaration } from "@fncts/schema/AST";

import { DeclarationError, TypeError } from "@fncts/schema/ParseError";
import { isLeft, isRight, strictEqualTo } from "@fncts/test/control/Assertion";
import { assert } from "vitest";

suite("Schema either", () => {
  test("success - Left", () => {
    const schema = Schema.either(Schema.string, Schema.number);

    return schema.decode(Either.left("error")).assert(isRight(isLeft(strictEqualTo("error"))));
  });

  test("success - Right", () => {
    const schema = Schema.either(Schema.string, Schema.number);

    return schema.decode(Either.right(42)).assert(isRight(isRight(strictEqualTo(42))));
  });

  test("failure - wrong outer type", () => {
    const schema = Schema.either(Schema.string, Schema.number);

    const result = schema.decode(42);

    Either.concrete(result);
    if (result.isRight()) {
      assert.fail("should be Left");
    }

    return result.left.assert(
      strictEqualTo(DeclarationError(schema.ast as Declaration, 42, TypeError(Equatable.anything, 42))),
    );
  });

  test("failure - invalid Left payload", () => {
    const schema = Schema.either(Schema.string, Schema.number);
    const input  = Either.left(1);

    const result = schema.decode(input);

    Either.concrete(result);
    if (result.isRight()) {
      assert.fail("should be Left");
    }

    return result.left.assert(
      strictEqualTo(DeclarationError(schema.ast as Declaration, input, TypeError(Equatable.anything, 1))),
    );
  });

  test("failure - invalid Right payload", () => {
    const schema = Schema.either(Schema.string, Schema.number);
    const input  = Either.right("not a number");

    const result = schema.decode(input);

    Either.concrete(result);
    if (result.isRight()) {
      assert.fail("should be Left");
    }

    return result.left.assert(
      strictEqualTo(DeclarationError(schema.ast as Declaration, input, TypeError(AST.numberKeyword, "not a number"))),
    );
  });
});
