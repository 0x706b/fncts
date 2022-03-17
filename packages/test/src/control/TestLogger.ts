import type { UIO, URIO } from "@fncts/base/control/IO";
import type { Has } from "@fncts/base/prelude";

import { Console } from "@fncts/base/control/Console";
import { IO } from "@fncts/base/control/IO";
import { Layer } from "@fncts/base/control/Layer";
import { Tag } from "@fncts/base/data/Tag";

/**
 * @tsplus type fncts.test.control.TestLogger
 * @tsplus companion fncts.test.control.TestLoggerOps
 */
export abstract class TestLogger {
  abstract logLine(line: string): UIO<void>;
}

/**
 * @tsplus static fncts.test.control.TestLoggerOps Tag
 */
export const TestLoggerTag = Tag<TestLogger>();

/**
 * @tsplus static fncts.test.control.TestLoggerOps fromConsole
 */
export const fromConsole: Layer<Has<Console>, never, Has<TestLogger>> = Layer.fromIO(
  TestLogger.Tag,
)(
  IO.serviceWithIO(Console.Tag)((console) =>
    IO.succeedNow(
      new (class extends TestLogger {
        logLine(line: string): UIO<void> {
          return console.print(line);
        }
      })(),
    ),
  ),
);

/**
 * @tsplus static fncts.test.control.TestLoggerOps logLine
 */
export function logLine(line: string): URIO<Has<TestLogger>, void> {
  return IO.serviceWithIO(TestLogger.Tag)((testLogger) => testLogger.logLine(line));
}
