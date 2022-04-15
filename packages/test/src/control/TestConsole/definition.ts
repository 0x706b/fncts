import type { Console } from "@fncts/base/control/Console";
import type { Live } from "@fncts/test/control/Live";

import { showWithOptions } from "@fncts/base/typeclass/Showable";

export class ConsoleData extends CaseClass<{
  readonly input: Vector<string>;
  readonly output: Vector<string>;
  readonly errOutput: Vector<string>;
  readonly debugOutput: Vector<string>;
}> {}

/**
 * @tsplus type fncts.test.TestConsole
 * @tsplus companion fncts.test.TestConsoleOps
 */
export class TestConsole implements Console {
  constructor(readonly consoleState: Ref<ConsoleData>, readonly live: Live, readonly debugState: FiberRef<boolean>) {}
  show(...input: ReadonlyArray<unknown>): UIO<void> {
    return this.consoleState.update((data) =>
      data.copy({
        output: data.output.concat(
          input.foldLeft(Vector.empty(), (b, a) => b.append(showWithOptions(a, { colors: false }))),
        ),
      }),
    );
  }
  print(line: string): UIO<void> {
    return this.consoleState.update((data) =>
      data.copy({
        output: data.output.append(`${line}\n`),
      }),
    );
  }
  error(line: string): UIO<void> {
    return this.consoleState.update((data) =>
      data.copy({
        errOutput: data.errOutput.append(`${line}\n`),
      }),
    );
  }
  clearInput  = this.consoleState.update((data) => data.copy({ input: Vector.empty() }));
  clearOutput = this.consoleState.update((data) => data.copy({ output: Vector.empty() }));
  output      = this.consoleState.get.map((data) => data.output);
  errOutput   = this.consoleState.get.map((data) => data.errOutput);
  debugOutput = this.consoleState.get.map((data) => data.debugOutput);
  feedLines(...lines: ReadonlyArray<string>): UIO<void> {
    return this.consoleState.update((data) => data.copy({ input: data.input.concat(Vector.from(lines)) }));
  }
  silent<R, E, A>(io: IO<R, E, A>): IO<R, E, A> {
    return this.debugState.locally(false)(io);
  }
  debug<R, E, A>(io: IO<R, E, A>): IO<R, E, A> {
    return this.debugState.locally(true)(io);
  }
}

/**
 * @tsplus static fncts.test.TestConsoleOps Tag
 */
export const TestConsoleTag = Tag<TestConsole>();
