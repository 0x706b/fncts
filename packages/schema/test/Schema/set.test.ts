import type { Declaration } from "@fncts/schema/AST";

import { set } from "@fncts/schema/Schema/api/set";
import { DeclarationError, IterableError, KeyError, TypeError } from "@fncts/schema/ParseError";

import { deepEqualTo, isLeft, isRight, strictEqualTo } from "@fncts/test/control/Assertion";

suite("Schema set", () => {
  test("success", () => {
    const schema = set(Schema.string);
    const input  = new Set(["a", "b", "c"]);

    return schema.decode(input).assert(isRight(deepEqualTo(input)));
  });

  test("failure - wrong outer type", () => {
    const schema = set(Schema.string);

    return schema.decode(42).assert(
      isLeft(strictEqualTo(DeclarationError(schema.ast as Declaration, 42, TypeError(Equatable.anything, 42)))),
    );
  });

  test("failure - invalid member", () => {
    const schema = set(Schema.string);
    const input  = new Set<unknown>(["a", 1, "c"]);

    return schema.decode(input).assert(
      isLeft(
        strictEqualTo(
            DeclarationError(
              schema.ast as Declaration,
              input,
              IterableError(Equatable.anything, input, Vector(KeyError(AST.stringKeyword, 1, TypeError(AST.stringKeyword, 1)))),
            ),
          ),
        ),
    );
  });

  test("failure - multiple invalid members", () => {
    const schema = set(Schema.string);
    const input  = new Set<unknown>([1, 2, "c"]);

    return schema.decode(input, { allErrors: true }).assert(
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
