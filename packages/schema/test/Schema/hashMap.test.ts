import type { Declaration } from "@fncts/schema/AST";

import { DeclarationError, IterableError, KeyError, TypeError } from "@fncts/schema/ParseError";
import { hashMap } from "@fncts/schema/Schema/api/hashMap";
import { isLeft, isRight, strictEqualTo } from "@fncts/test/control/Assertion";

suite("Schema hashMap", () => {
  test("success", () => {
    const schema = hashMap(Schema.string, Schema.number);
    const input  = HashMap.from<string, number>([
      ["a", 1],
      ["b", 2],
    ]);

    return schema.decode(input).assert(isRight(strictEqualTo(input)));
  });

  test("failure - wrong outer type", () => {
    const schema = hashMap(Schema.string, Schema.number);

    return schema
      .decode(42)
      .assert(
        isLeft(strictEqualTo(DeclarationError(schema.ast as Declaration, 42, TypeError(Equatable.anything, 42)))),
      );
  });

  test("failure - invalid key", () => {
    const schema = hashMap(Schema.string, Schema.number);
    const input  = HashMap.from<unknown, number>([
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
    const schema = hashMap(Schema.string, Schema.number);
    const input  = HashMap.from<string, unknown>([
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
    const schema = hashMap(Schema.string, Schema.number);
    const input  = HashMap.from<unknown, unknown>([
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
