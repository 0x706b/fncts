import type { Refinement } from "@fncts/schema/AST";

import { RefinementError, TypeError } from "@fncts/schema/ParseError";

import { expectSuccess } from "../utils.js";

suite("Schema instanceOf", () => {
  test("success", () => {
    const schema = Schema.object.instanceOf(Date);

    const date = new Date();
    expectSuccess(schema, date, date);
  });

  test("failure - wrong constructor", () => {
    const schema = Schema.object.instanceOf(Date);

    const result = schema.decode("not a date").match(
      (e) => e,
      () => {
        throw new Error("should fail");
      },
    );

    return result._tag.assert(strictEqualTo(7));
  });

  test("failure - plain object", () => {
    const schema = Schema.object.instanceOf(Date);

    const result = schema.decode({}).match(
      (e) => e,
      () => {
        throw new Error("should fail");
      },
    );

    return result._tag.assert(strictEqualTo(7));
  });

  test("failure - null", () => {
    const schema = Schema.object.instanceOf(Date);

    const result = schema.decode(null).match(
      (e) => e,
      () => {
        throw new Error("should fail");
      },
    );

    return result._tag.assert(strictEqualTo(7));
  });

  test("with custom class", () => {
    class Person {
      constructor(readonly name: string) {}
    }

    const schema = Schema.object.instanceOf(Person);

    expectSuccess(schema, new Person("Alice"), new Person("Alice"));

    const result = schema.decode({ name: "Alice" }).match(
      (e) => e,
      () => {
        throw new Error("should fail");
      },
    );

    return result._tag.assert(strictEqualTo(7));
  });
});
