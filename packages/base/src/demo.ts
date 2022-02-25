import { Iterable } from "./collection/immutable/Iterable";
import { FiberContext } from "./control/Fiber/FiberContext";
import { concrete, IO } from "./control/IO";
import { Logger } from "./control/Logger";
import { Finalizer } from "./control/Managed/Finalizer";
import { Supervisor } from "./control/Supervisor";
import { Either } from "./data/Either";
import { FiberId } from "./data/FiberId";
import { LogLevel } from "./data/LogLevel";
import { RuntimeConfig, RuntimeConfigFlags } from "./data/RuntimeConfig";
import { Stack } from "./internal/Stack";

const config = new RuntimeConfig({
  reportFailure: () => undefined,
  supervisor: Supervisor.none,
  flags: RuntimeConfigFlags.empty,
  yieldOpCount: 2048,
  logger: Logger.defaultString.map(console.log.bind(console)).filterLogLevel((level) => level >= LogLevel.Info),
});

const as = Iterable.range(0, 10);

const effect = IO.succeed(console.time("A"))
  .apSecond(
    IO.foreachC(as, (n) =>
      IO.asyncInterrupt<unknown, never, number>((k) => {
        const handle = setTimeout(() => {
          k(IO.succeedNow(n));
        }, n * 10);
        return Either.left(IO.succeed(clearTimeout(handle)));
      }),
    ),
  )
  .apFirst(IO.succeed(console.timeEnd("A")))
  .withConcurrency(2);

const fiber = new FiberContext(FiberId.newFiberId(), config, Stack.make(true), new Map(), new Set());

fiber.unsafeRunLater(concrete(effect));

fiber.awaitAsync((exit) => {
  console.log(exit);
});
