import { implicitDate } from "@fncts/schema/Schema/api";
import { assert } from "vitest";

import { expectSuccess } from "../utils.js";

suite("Schema implicitDate", () => {
  test("success - Date input", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    expectSuccess(implicitDate, date, date);
  });

  test("success - string input", () => {
    const result = implicitDate.decode("2024-01-01T00:00:00.000Z").match(
      () => {
        throw new Error("should succeed");
      },
      (a: Date) => a,
    );

    assert.isTrue(result instanceof Date);
    assert.equal(result.getTime(), new Date("2024-01-01T00:00:00.000Z").getTime());
  });

  test("success - number input", () => {
    const timestamp = 1704067200000;
    const result    = implicitDate.decode(timestamp).match(
      () => {
        throw new Error("should succeed");
      },
      (a: Date) => a,
    );

    assert.isTrue(result instanceof Date);
    assert.equal(result.getTime(), timestamp);
  });

  test("failure - wrong type (object)", () => {
    const result = implicitDate.decode({}).match(
      (e) => e,
      () => {
        throw new Error("should fail");
      },
    );

    return result._tag.assert(strictEqualTo(8));
  });
});
