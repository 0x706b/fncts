import { FiberContext } from "./control/Fiber/FiberContext";
import { concrete, IO } from "./control/IO";
import { Logger } from "./control/Logger";
import { Supervisor } from "./control/Supervisor";
import { FiberId } from "./data/FiberId";
import { LogLevel } from "./data/LogLevel";
import { RuntimeConfig, RuntimeConfigFlags } from "./data/RuntimeConfig";
import { Stack } from "./internal/Stack";

const config = new RuntimeConfig({
  reportFailure: () => undefined,
  supervisor: Supervisor.none,
  flags: RuntimeConfigFlags.empty,
  yieldOpCount: 2048,
  logger: Logger.defaultString
    .map(console.log.bind(console))
    .filterLogLevel((level) => level >= LogLevel.Info),
});

const effect = IO.succeed(42).tap((n) =>
  IO.log(`The number is ${n.toString()}`)
);

const fiber = new FiberContext(
  FiberId.newFiberId(),
  config,
  Stack.make(true),
  new Map(),
  new Set()
);

fiber.unsafeRunLater(concrete(effect));

fiber.awaitAsync((exit) => {
  console.log(exit);
});
