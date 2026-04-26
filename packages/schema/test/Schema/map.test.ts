import type { Declaration } from "@fncts/schema/AST";

import { DeclarationError, IterableError, KeyError, TypeError } from "@fncts/schema/ParseError";
import { map } from "@fncts/schema/Schema/api/map";
import { isLeft, isRight } from "@fncts/test/control/Assertion";

suite("Schema map", () => {
  test("success", () => {
    const schema = map(Schema.string, Schema.number);
    const input  = new Map<string, number>([
      ["a", 1],
      ["b", 2],
    ]);

    return schema.decode(input).assert(isRight(deepEqualTo(input)));
  });

  test("failure - wrong outer type", () => {
    const schema = map(Schema.string, Schema.number);

    return schema
      .decode(42)
      .assert(
        isLeft(strictEqualTo(DeclarationError(schema.ast as Declaration, 42, TypeError(Equatable.anything, 42)))),
      );
  });

  test("failure - invalid key", () => {
    const schema = map(Schema.string, Schema.number);
    const input  = new Map<unknown, number>([
      [1, 1],
      ["b", 2],
    ]);

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

  test("failure - invalid value", () => {
    const schema = map(Schema.string, Schema.number);
    const input  = new Map<string, unknown>([
      ["a", "one"],
      ["b", 2],
    ]);

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
                Vector(KeyError(AST.stringKeyword, "a", TypeError(AST.numberKeyword, "one"))),
              ),
            ),
          ),
        ),
      );
  });

  test("failure - multiple invalid entries", () => {
    const schema = map(Schema.string, Schema.number);
    const input  = new Map<unknown, unknown>([
      [1, "one"],
      ["b", "two"],
    ]);

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
                  KeyError(AST.stringKeyword, 1, TypeError(AST.numberKeyword, "one")),
                  KeyError(AST.stringKeyword, "b", TypeError(AST.numberKeyword, "two")),
                ),
              ),
            ),
          ),
        ),
      );
  });
});
