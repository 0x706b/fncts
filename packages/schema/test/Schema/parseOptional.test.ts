import type { Transform, TypeLiteral } from "@fncts/schema/AST";

import { KeyError, TransformationError, TypeError, TypeLiteralError } from "@fncts/schema/ParseError";

import { deepEqualTo, isJust, isNothing, strictEqualTo } from "@fncts/test/control/Assertion";

import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema parseOptional", () => {
  test("parseOptional field in struct - present", () => {
    const schema = Schema.struct({
      name: Schema.string,
      maybeValue: Schema.number.parseOptional,
    });

    const result = schema.decode({ name: "test", maybeValue: 42 }).match(
      (e) => {
        throw e;
      },
      (a) => a,
    );

    return result.name.assert(strictEqualTo("test")) && result.maybeValue.assert(isJust(strictEqualTo(42)));
  });

  test("parseOptional field in struct - missing", () => {
    const schema = Schema.struct({
      name: Schema.string,
      maybeValue: Schema.number.parseOptional,
    });

    const result = schema.decode({ name: "test" }).match(
      (e) => {
        throw e;
      },
      (a) => a,
    );

    return result.name.assert(strictEqualTo("test")) && result.maybeValue.assert(isNothing);
  });

  test("parseOptional field in struct - null becomes Nothing", () => {
    const schema = Schema.struct({
      name: Schema.string,
      maybeValue: Schema.number.parseOptional,
    });

    const result = schema.decode({ name: "test", maybeValue: null }).match(
      (e) => {
        throw e;
      },
      (a) => a,
    );

    return result.name.assert(strictEqualTo("test")) && result.maybeValue.assert(isNothing);
  });

  test("parseOptional field in struct - undefined becomes Nothing", () => {
    const schema = Schema.struct({
      name: Schema.string,
      maybeValue: Schema.number.parseOptional,
    });

    const result = schema.decode({ name: "test", maybeValue: undefined }).match(
      (e) => {
        throw e;
      },
      (a) => a,
    );

    return result.name.assert(strictEqualTo("test")) && result.maybeValue.assert(isNothing);
  });

  test("parseOptional field in struct - wrong type", () => {
    const schema = Schema.struct({
      name: Schema.string,
      maybeValue: Schema.number.parseOptional,
    });

    const result = schema.decode({ name: "test", maybeValue: "not a number" }).match(
      (e) => e,
      () => {
        throw new Error("should fail");
      },
    );

    return result._tag.assert(strictEqualTo(8));
  });

  test("multiple parseOptional fields", () => {
    const schema = Schema.struct({
      a: Schema.string,
      b: Schema.number.parseOptional,
      c: Schema.boolean.parseOptional,
    });

    const result1 = schema.decode({ a: "x" }).match(
      (e) => {
        throw e;
      },
      (a) => a,
    );

    const check1 = result1.a.assert(strictEqualTo("x")) && result1.b.assert(isNothing) && result1.c.assert(isNothing);

    const result2 = schema.decode({ a: "x", b: 42 }).match(
      (e) => {
        throw e;
      },
      (a) => a,
    );

    const check2 =
      result2.a.assert(strictEqualTo("x")) &&
      result2.b.assert(isJust(strictEqualTo(42))) &&
      result2.c.assert(isNothing);

    const result3 = schema.decode({ a: "x", b: 42, c: true }).match(
      (e) => {
        throw e;
      },
      (a) => a,
    );

    const check3 =
      result3.a.assert(strictEqualTo("x")) &&
      result3.b.assert(isJust(strictEqualTo(42))) &&
      result3.c.assert(isJust(strictEqualTo(true)));

    return check1 && check2 && check3;
  });
});
