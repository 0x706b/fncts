import { expectSuccess } from "../utils.js";

suite("Schema keyof", () => {
  test("success - basic struct", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string,
    }).keyof;

    expectSuccess(schema, "a", "a");
    expectSuccess(schema, "b", "b");
  });

  test("failure - not a key", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string,
    }).keyof;

    const result = schema.decode("c").match(
      (e) => e,
      () => {
        throw new Error("should fail");
      },
    );

    return result._tag.assert(strictEqualTo(11));
  });

  test("failure - wrong type", () => {
    const schema = Schema.struct({
      a: Schema.number,
    }).keyof;

    const result = schema.decode(42).match(
      (e) => e,
      () => {
        throw new Error("should fail");
      },
    );

    return result._tag.assert(strictEqualTo(1));
  });
});
