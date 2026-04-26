import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema uniqueSymbol", () => {
  const sym = Symbol.for("test-symbol");

  test("success", () => {
    const schema = Schema.uniqueSymbol(sym);

    expectSuccess(schema, sym, sym);
  });

  test("failure - different symbol", () => {
    const schema   = Schema.uniqueSymbol(sym);
    const otherSym = Symbol.for("other-symbol");

    expectFailure(schema, otherSym, ParseError.TypeError(schema.ast, otherSym));
  });

  test("failure - wrong type", () => {
    const schema = Schema.uniqueSymbol(sym);

    expectFailure(schema, "not a symbol", ParseError.TypeError(schema.ast, "not a symbol"));
  });

  test("with annotations", () => {
    const annotatedSym = Symbol.for("annotated-symbol");
    const schema       = Schema.uniqueSymbol(annotatedSym);

    expectSuccess(schema, annotatedSym, annotatedSym);
  });
});
