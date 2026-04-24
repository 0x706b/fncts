import { assert } from "vitest";

function expectEqual(left: unknown, right: unknown) {
  assert.isTrue(Equatable.strictEquals(left, right));
  assert.isTrue(Equatable.deepEquals(left, right));
}

function expectNotEqual(left: unknown, right: unknown) {
  assert.isFalse(Equatable.strictEquals(left, right));
  assert.isFalse(Equatable.deepEquals(left, right));
}

suite("AST structural equality", () => {
  test("equal primitive AST nodes", () => {
    expectEqual(AST.createLiteral("a"), AST.createLiteral("a"));

    const symbol = Symbol.for("ast-structural-equality");
    expectEqual(AST.createUniqueSymbol(symbol), AST.createUniqueSymbol(symbol));

    expectEqual(
      AST.createEnum(Vector(["a", 1] as const, ["b", 2] as const)),
      AST.createEnum(Vector(["a", 1] as const, ["b", 2] as const)),
    );
  });

  test("unequal nodes with different payloads", () => {
    expectNotEqual(AST.createLiteral("a"), AST.createLiteral("b"));
    expectNotEqual(AST.createEnum(Vector(["a", 1] as const)), AST.createEnum(Vector(["a", 2] as const)));
  });

  test("annotations compare structurally", () => {
    const annotations1 = ASTAnnotationMap.empty.annotate(
      ASTAnnotation.Surrogate,
      AST.createTuple(Vector(AST.createElement(AST.stringKeyword, false)), Just(Vector(AST.numberKeyword)), true),
    );
    const annotations2 = ASTAnnotationMap.empty.annotate(
      ASTAnnotation.Surrogate,
      AST.createTuple(Vector(AST.createElement(AST.stringKeyword, false)), Just(Vector(AST.numberKeyword)), true),
    );

    expectEqual(AST.createLiteral("annotated", annotations1), AST.createLiteral("annotated", annotations2));
  });

  test("equal nested tuple, type literal, and union structures", () => {
    const tuple1 = AST.createTuple(
      Vector(AST.createElement(AST.stringKeyword, false), AST.createElement(AST.numberKeyword, true)),
      Just(Vector(AST.booleanKeyword)),
      true,
    );
    const tuple2 = AST.createTuple(
      Vector(AST.createElement(AST.stringKeyword, false), AST.createElement(AST.numberKeyword, true)),
      Just(Vector(AST.booleanKeyword)),
      true,
    );

    const typeLiteral1 = AST.createTypeLiteral(
      Vector(
        AST.createPropertySignature("name", AST.stringKeyword, false, true),
        AST.createPropertySignature(Symbol.for("flag"), AST.booleanKeyword, true, false),
      ),
      Vector(AST.createIndexSignature(AST.stringKeyword, tuple1, true)),
    );
    const typeLiteral2 = AST.createTypeLiteral(
      Vector(
        AST.createPropertySignature("name", AST.stringKeyword, false, true),
        AST.createPropertySignature(Symbol.for("flag"), AST.booleanKeyword, true, false),
      ),
      Vector(AST.createIndexSignature(AST.stringKeyword, tuple2, true)),
    );

    expectEqual(AST.createUnion(Vector(tuple1, typeLiteral1)), AST.createUnion(Vector(tuple2, typeLiteral2)));
  });

  test("refinement and transform compare functions by reference", () => {
    const positive1 = (n: number): n is number => n > 0;
    const positive2 = (n: number): n is number => n > 0;
    const decode1   = (s: string) => ParseResult.succeed(s.length);
    const decode2   = (s: string) => ParseResult.succeed(s.length);
    const encode1   = (n: number) => ParseResult.succeed(String(n));
    const encode2   = (n: number) => ParseResult.succeed(String(n));

    expectNotEqual(
      AST.createRefinement(AST.numberKeyword, positive1),
      AST.createRefinement(AST.numberKeyword, positive2),
    );
    expectNotEqual(
      AST.createTransform(AST.stringKeyword, AST.numberKeyword, decode1, encode1),
      AST.createTransform(AST.stringKeyword, AST.numberKeyword, decode2, encode2),
    );
  });

  test("validation nodes compare branded validations structurally", () => {
    const predicate1 = (n: number) => n > 0;
    const predicate2 = (n: number) => n > 0;

    expectEqual(
      AST.createValidation(AST.numberKeyword, Vector(Validation(predicate1, "Positive" as string))),
      AST.createValidation(AST.numberKeyword, Vector(Validation(predicate1, "Positive" as string))),
    );
    expectNotEqual(
      AST.createValidation(AST.numberKeyword, Vector(Validation(predicate1, "Positive" as string))),
      AST.createValidation(AST.numberKeyword, Vector(Validation(predicate2, "Positive" as string))),
    );
  });

  test("lazy nodes compare by reference only", () => {
    const left  = AST.createLazy(() => AST.stringKeyword);
    const right = AST.createLazy(() => AST.stringKeyword);

    expectEqual(left, left);
    expectNotEqual(left, right);
  });
});
