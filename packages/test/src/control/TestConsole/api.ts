import { Console } from "@fncts/io/Console";
import { IOEnv } from "@fncts/io/IOEnv";
import { Live } from "@fncts/test/control/Live";
import { ConsoleData } from "@fncts/test/control/TestConsole/definition";
import { TestConsole } from "@fncts/test/control/TestConsole/definition";

/**
 * @tsplus static fncts.test.TestConsoleOps make
 */
export function make(data: ConsoleData, debug = true): Layer<Live, never, TestConsole> {
  return Layer.scopedEnvironment(
    IO.serviceWithIO(
      (live) =>
        Do((_) => {
          const ref      = _(Ref.make(data));
          const debugRef = _(FiberRef.make(debug));
          const test     = new TestConsole(ref, live, debugRef);
          _(IOEnv.services.locallyScopedWith((_) => _.add(test, Console.Tag)));
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
