import type { Declaration } from "@fncts/schema/AST";

import { DeclarationError, IterableError, KeyError, TypeError } from "@fncts/schema/ParseError";
import { hashSet } from "@fncts/schema/Schema/api/hashSet";
import { isLeft, isRight } from "@fncts/test/control/Assertion";

suite("Schema hashSet", () => {
  test("success", () => {
    const schema = hashSet(Schema.string);
    const input  = HashSet.from(["a", "b", "c"]);

    return schema.decode(input).assert(isRight(strictEqualTo(input)));
  });

  test("failure - wrong outer type", () => {
    const schema = hashSet(Schema.string);

    return schema
      .decode(42)
      .assert(
        isLeft(strictEqualTo(DeclarationError(schema.ast as Declaration, 42, TypeError(Equatable.anything, 42)))),
      );
  });

  test("failure - invalid member", () => {
    const schema = hashSet(Schema.string);
    const input  = HashSet.from<unknown>(["a", 1, "c"]);

    return schema
      .decode(input)
      .assert(
        isLeft(
          strictEqualTo(
            DeclarationError(
              schema.ast as Declaration,
              input,
              IterableError(
                Equatable.anything,
                input,
                Vector(KeyError(AST.stringKeyword, 1, TypeError(AST.stringKeyword, 1))),
              ),
            ),
          ),
        ),
      );
  });

  test("failure - multiple invalid members", () => {
    const schema = hashSet(Schema.string);
    const input  = HashSet.from<unknown>([1, 2, "c"]);

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
                Vector(
                  KeyError(AST.stringKeyword, 1, TypeError(AST.stringKeyword, 1)),
                  KeyError(AST.stringKeyword, 2, TypeError(AST.stringKeyword, 2)),
                ),
              ),
            ),
          ),
        ),
      );
  });
});
