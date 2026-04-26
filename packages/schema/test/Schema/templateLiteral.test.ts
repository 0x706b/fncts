import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema templateLiteral", () => {
  test("success - simple template", () => {
    const schema = Schema.templateLiteral(Schema.literal("user:"), Schema.string);

    expectSuccess(schema, "user:123", "user:123");
    expectSuccess(schema, "user:abc", "user:abc");
  });

  test("success - numeric template", () => {
    const schema = Schema.templateLiteral(Schema.literal("id-"), Schema.number);

    expectSuccess(schema, "id-1", "id-1");
    expectSuccess(schema, "id-42", "id-42");
  });

  test("success - multiple parts", () => {
    const schema = Schema.templateLiteral(Schema.literal("http://"), Schema.string, Schema.literal(".com"));

    expectSuccess(schema, "http://example.com", "http://example.com");
  });

  test("failure - wrong prefix", () => {
    const schema = Schema.templateLiteral(Schema.literal("user:"), Schema.string);

    expectFailure(schema, "admin:123", ParseError.TypeError(schema.ast, "admin:123"));
  });

  test("failure - not a string", () => {
    const schema = Schema.templateLiteral(Schema.literal("prefix-"), Schema.number);

    expectFailure(schema, 42, ParseError.TypeError(schema.ast, 42));
  });
});
