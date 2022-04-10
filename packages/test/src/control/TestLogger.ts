import { Console } from "@fncts/base/control/Console";

/**
 * @tsplus type fncts.test.control.TestLogger
 * @tsplus companion fncts.test.control.TestLoggerOps
 */
export abstract class TestLogger {
  abstract logLine(line: string): UIO<void>;
}

export const TestLoggerKey = Symbol.for("fncts.test.control.TestLogger.ServiceKey");

/**
 * @tsplus static fncts.test.control.TestLoggerOps Tag
 */
export const TestLoggerTag = Tag<TestLogger>(TestLoggerKey);

/**
 * @tsplus static fncts.test.control.TestLoggerOps fromConsole
 */
export const fromConsole: Layer<Has<Console>, never, Has<TestLogger>> = Layer.fromIO(
  IO.serviceWithIO(
    (console) =>
      IO.succeedNow(
        new (class extends TestLogger {
          logLine(line: string): UIO<void> {
            return console.print(line);
          }
        })(),
      ),
    Console.Tag,
  ),
  TestLogger.Tag,
);

/**
 * @tsplus static fncts.test.control.TestLoggerOps logLine
 */
export function logLine(line: string): URIO<Has<TestLogger>, void> {
  return IO.serviceWithIO((testLogger) => testLogger.logLine(line), TestLogger.Tag);
}
