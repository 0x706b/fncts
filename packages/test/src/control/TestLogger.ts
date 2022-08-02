import { Console } from "@fncts/io/Console";

/**
 * @tsplus type fncts.test.TestLogger
 * @tsplus companion fncts.test.TestLoggerOps
 */
export abstract class TestLogger {
  abstract logLine(line: string): UIO<void>;
}

/**
 * @tsplus static fncts.test.TestLoggerOps Tag
 */
export const TestLoggerTag = Tag<TestLogger>();

/**
 * @tsplus static fncts.test.TestLoggerOps fromConsole
 */
export const fromConsole: Layer<never, never, TestLogger> = Layer.fromIO(
  IO.consoleWith((console) =>
    IO.succeedNow(
      new (class extends TestLogger {
        logLine(line: string): UIO<void> {
          return console.print(line);
        }
      })(),
    ),
  ),
  TestLogger.Tag,
);

/**
 * @tsplus static fncts.test.TestLoggerOps logLine
 */
export function logLine(line: string): URIO<TestLogger, void> {
  return IO.serviceWithIO((testLogger) => testLogger.logLine(line), TestLogger.Tag);
}
