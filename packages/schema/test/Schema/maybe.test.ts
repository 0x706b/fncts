import type { Declaration } from "@fncts/schema/AST";

import { DeclarationError, TypeError } from "@fncts/schema/ParseError";
import { isJust, isLeft, isNothing } from "@fncts/test/control/Assertion";

suite("Schema maybe", () => {
  test("success - Just", () => {
    const schema = Schema.maybe(Schema.number);

    const result = schema.decode(Just(42)).match(
      (e) => {
        throw e;
      },
      (a) => a,
    );

    return result.assert(isJust(strictEqualTo(42)));
  });

  test("success - Nothing", () => {
    const schema = Schema.maybe(Schema.number);

    const result = schema.decode(Nothing()).match(
      (e) => {
        throw e;
      },
      (a) => a,
    );

    return result.assert(isNothing);
  });

  test("failure - wrong outer type", () => {
    const schema = Schema.maybe(Schema.number);

    return schema
      .decode(42)
      .assert(
        isLeft(strictEqualTo(DeclarationError(schema.ast as Declaration, 42, TypeError(Equatable.anything, 42)))),
      );
  });

  test("failure - invalid Just payload", () => {
    const schema = Schema.maybe(Schema.number);
    const input  = Just("not a number");
    return schema
      .decode(input)
      .assert(
        isLeft(
          strictEqualTo(
            DeclarationError(schema.ast as Declaration, input, TypeError(AST.numberKeyword, "not a number")),
          ),
        ),
      );
  });
});
