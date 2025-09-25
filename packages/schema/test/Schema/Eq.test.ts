import { assert } from "vitest";

suite("Eq interpreter", () => {
  test("TypeLiteral", () => {
    const s1     = Symbol();
    const s2     = Symbol();
    const schema = Derive<Schema<{ a: string; b: number; [x: symbol]: boolean; [n: number]: string }>>();
    assert.isTrue(
      schema.equals(
        { a: "a", b: 1, [s1]: true, [s2]: false, 1: "a" },
        { a: "a", b: 1, [s1]: true, [s2]: false, 1: "a" },
      ),
    );
    assert.isFalse(
      schema.equals(
        { a: "a", b: 1, [s1]: true, [s2]: false, 1: "a" },
        { a: "b", b: 2, [s1]: true, [s2]: false, 1: "a" },
      ),
    );
    assert.isFalse(
      schema.equals(
        { a: "a", b: 1, [s1]: true, [s2]: false, 1: "a" },
        { a: "a", b: 2, [s1]: true, [s2]: false, 1: "a" },
      ),
    );
    assert.isFalse(
      schema.equals(
        { a: "a", b: 1, [s1]: true, [s2]: false, 1: "a" },
        { a: "a", b: 1, [s1]: true, [s2]: true, 1: "a" },
      ),
    );
    assert.isFalse(
      schema.equals(
        { a: "a", b: 1, [s1]: true, [s2]: false, 1: "a" },
        { a: "a", b: 1, [s1]: true, [s2]: false, 1: "b" },
      ),
    );
    assert.isFalse(
      schema.equals(
        { a: "a", b: 1, [s1]: true, [s2]: false, 1: "a" },
        { a: "a", b: 1, [s1]: true, [s2]: false, 2: "a" },
      ),
    );
  });
  test("Tuple", () => {
    const schema = Derive<Schema<[string, number, boolean, Array<number>, string]>>();
    assert.isTrue(schema.equals(["a", 1, true, [1, 2, 3], "b"], ["a", 1, true, [1, 2, 3], "b"]));
    assert.isFalse(schema.equals(["a", 1, true, [3, 2, 1], "b"], ["a", 1, true, [1, 2, 3], "b"]));
  });
});
