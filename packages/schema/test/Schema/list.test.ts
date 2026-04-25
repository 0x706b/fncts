import type { Declaration } from "@fncts/schema/AST";

import { DeclarationError, IndexError, IterableError, TypeError } from "@fncts/schema/ParseError";
import { isLeft, isRight } from "@fncts/test/control/Assertion";

suite("Schema list", () => {
  test("success", () => {
    const schema = Schema.list(Schema.string);
    const input  = List.from(["a", "b", "c"]);

    return schema.decode(input).assert(isRight(strictEqualTo(input)));
  });

  test("failure - wrong outer type", () => {
    const schema = Schema.list(Schema.string);

    return schema
      .decode(42)
      .assert(
        isLeft(strictEqualTo(DeclarationError(schema.ast as Declaration, 42, TypeError(Equatable.anything, 42)))),
      );
  });

  test("failure - invalid element", () => {
    const schema = Schema.list(Schema.string);
    const input  = List.from(["a", 1, "c"]);

    return schema
      .decode(input)
      .assert(
        isLeft(
          strictEqualTo(
            DeclarationError(
              schema.ast as Declaration,
              input,
              IterableError(Equatable.anything, input, Vector(IndexError(1, TypeError(AST.stringKeyword, 1)))),
            ),
          ),
        ),
      );
  });

  test("failure - multiple invalid elements", () => {
    const schema = Schema.list(Schema.string);
    const input  = List.from([1, 2, "c"]);

    return schema
      .decode(input, { allErrors: true })
      .assert(
        isLeft(
          strictEqualTo(
            DeclarationError(
              schema.ast as Declaration,
              input,
              IterableError(
                Equatable.anything,
                input,
                Vector(IndexError(0, TypeError(AST.stringKeyword, 1)), IndexError(1, TypeError(AST.stringKeyword, 2))),
              ),
            ),
          ),
        ),
      );
  });
});
