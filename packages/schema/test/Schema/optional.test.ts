import { expectSuccess } from "../utils.js";

suite("Schema optional", () => {
  test("optional field in struct - present", () => {
    const schema = Schema.struct({
      required: Schema.number,
      optional: Schema.string.optional,
    });

    expectSuccess(schema, { required: 42, optional: "hello" }, { required: 42, optional: "hello" });
  });

  test("optional field in struct - missing", () => {
    const schema = Schema.struct({
      required: Schema.number,
      optional: Schema.string.optional,
    });

    expectSuccess(schema, { required: 42 }, { required: 42 });
  });

  test("optional field with wrong type fails", () => {
    const schema = Schema.struct({
      required: Schema.number,
      optional: Schema.string.optional,
    });

    const result = schema.decode({ required: 42, optional: 123 }).match(
      (e) => e,
      () => {
        throw new Error("should fail");
      },
    );

    return result._tag.assert(strictEqualTo(9));
  });

  test("multiple optional fields", () => {
    const schema = Schema.struct({
      a: Schema.number,
      b: Schema.string.optional,
      c: Schema.boolean.optional,
    });

    expectSuccess(schema, { a: 1 }, { a: 1 });
    expectSuccess(schema, { a: 1, b: "x" }, { a: 1, b: "x" });
    expectSuccess(schema, { a: 1, b: "x", c: true }, { a: 1, b: "x", c: true });
    expectSuccess(schema, { a: 1, c: false }, { a: 1, c: false });
  });
});
