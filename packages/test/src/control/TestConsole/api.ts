import { Console } from "@fncts/io/Console";
import { IOEnv } from "@fncts/io/IOEnv";
import { Live } from "@fncts/test/control/Live";
import { ConsoleData } from "@fncts/test/control/TestConsole/definition";
import { TestConsole } from "@fncts/test/control/TestConsole/definition";

/**
 * @tsplus static fncts.test.TestConsoleOps make
 */
export function make(data: ConsoleData, debug = true): Layer<Has<Live>, never, Has<TestConsole>> {
  return Layer.scopedEnvironment(
    IO.serviceWithIO(
      (live) =>
        IO.gen(function* (_) {
          const ref      = yield* _(Ref.make(data));
          const debugRef = yield* _(FiberRef.make(debug));
          const test     = new TestConsole(ref, live, debugRef);
          yield* _(IOEnv.services.locallyScopedWith((_) => _.add(test, Console.Tag)));
          return Environment.empty.add(test, TestConsole.Tag);
        }),
      Live.Tag,
    ),
  );
}

/**
 * @tsplus static fncts.test.TestConsoleOps Live
 */
export const live = TestConsole.make(
  new ConsoleData({
    input: Vector.empty(),
    output: Vector.empty(),
    errOutput: Vector.empty(),
    debugOutput: Vector.empty(),
  }),
);
