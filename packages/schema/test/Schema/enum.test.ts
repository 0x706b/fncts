import { expectFailure, expectSuccess } from "../utils.js";

suite("Schema enum", () => {
  enum Direction {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT",
  }

  test("success", () => {
    const schema = Schema.enum(Direction);

    expectSuccess(schema, Direction.Up, Direction.Up);
    expectSuccess(schema, Direction.Down, Direction.Down);
    expectSuccess(schema, Direction.Left, Direction.Left);
    expectSuccess(schema, Direction.Right, Direction.Right);
  });

  test("failure - invalid value", () => {
    const schema = Schema.enum(Direction);

    expectFailure(schema, "INVALID", ParseError.TypeError(schema.ast, "INVALID"));
  });

  test("failure - wrong type", () => {
    const schema = Schema.enum(Direction);

    expectFailure(schema, 42, ParseError.TypeError(schema.ast, 42));
  });

  enum NumericStatus {
    Active = 1,
    Inactive = 0,
    Pending = 2,
  }

  test("success - numeric enum", () => {
    const schema = Schema.enum(NumericStatus);

    expectSuccess(schema, NumericStatus.Active, NumericStatus.Active);
    expectSuccess(schema, NumericStatus.Inactive, NumericStatus.Inactive);
    expectSuccess(schema, NumericStatus.Pending, NumericStatus.Pending);
  });

  test("failure - numeric enum invalid", () => {
    const schema = Schema.enum(NumericStatus);

    expectFailure(schema, 99, ParseError.TypeError(schema.ast, 99));
  });
});
