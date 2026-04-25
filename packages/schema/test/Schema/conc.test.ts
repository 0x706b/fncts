import type { Declaration } from "@fncts/schema/AST";

import { conc } from "@fncts/schema/Schema/api/conc";
import { DeclarationError, IndexError, IterableError, TypeError } from "@fncts/schema/ParseError";

import { deepEqualTo, isLeft, isRight, strictEqualTo } from "@fncts/test/control/Assertion";

suite("Schema conc", () => {
  test("success", () => {
    const schema = conc(Schema.string);
    const input  = Conc.from(["a", "b", "c"]);

    return schema.decode(input).assert(isRight(deepEqualTo(input)));
  });

  test("failure - wrong outer type", () => {
    const schema = conc(Schema.string);

    return schema.decode(42).assert(
      isLeft(strictEqualTo(DeclarationError(schema.ast as Declaration, 42, TypeError(Equatable.anything, 42)))),
    );
  });

  test("failure - invalid element", () => {
    const schema = conc(Schema.string);
    const input  = Conc.from(["a", 1, "c"]);

    return schema.decode(input).assert(
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
    const schema = conc(Schema.string);
    const input  = Conc.from([1, 2, "c"]);

    return schema.decode(input, { allErrors: true }).assert(
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
