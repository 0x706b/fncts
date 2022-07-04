import { FiberMessage } from "@fncts/io/Fiber/FiberMessage";
import { FiberRuntime } from "@fncts/io/Fiber/FiberRuntime";
import { IOEnv } from "@fncts/io/IOEnv/definition";
import { RuntimeFlag } from "@fncts/io/RuntimeFlag";
import { RuntimeFlags } from "@fncts/io/RuntimeFlags";

export class Runtime<R> {
  constructor(readonly environment: Environment<R>, readonly runtimeConfig: RuntimeConfig) {}

  unsafeRunWith = <E, A>(
    io: IO<R, E, A>,
    k: (exit: Exit<E, A>) => any,
    __tsplusTrace?: string,
  ): ((fiberId: FiberId) => (f: (exit: Exit<E, A>) => any) => void) => {
    const fiberId   = FiberId.unsafeMake(TraceElement.parse(__tsplusTrace));
    const fiberRefs = FiberRefs(
      HashMap<FiberRef<unknown>, Cons<readonly [FiberId.Runtime, unknown]>>(
        [FiberRef.currentEnvironment, Cons([fiberId, this.environment])],
        [IOEnv.services, Cons([fiberId, IOEnv.environment])],
      ),
    );

    const fiber = new FiberRuntime(
      fiberId,
      fiberRefs,
      RuntimeFlags(RuntimeFlag.Interruption, RuntimeFlag.CooperativeYielding),
    );

    FiberScope.global.unsafeAdd(fiber);

    fiber.tell(FiberMessage.Stateful((fiber) => fiber.addObserver(k)));
    fiber.start(io);
    // @ts-expect-error
    return (fiberId) => (k) => this.unsafeRunAsyncWith<never, void>(fiber.interruptAsFork(fiberId), k);
  };

  unsafeRunAsync = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string) => {
    this.unsafeRunAsyncWith(io, () => void 0);
  };

  unsafeRunAsyncWith = <E, A>(io: IO<R, E, A>, k: (exit: Exit<E, A>) => any, __tsplusTrace?: string) => {
    this.unsafeRunWith(io, k);
  };

  unsafeRunPromiseExit = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): Promise<Exit<E, A>> =>
    new Promise((resolve) => {
      this.unsafeRunAsyncWith(io, resolve);
    });
}

export const defaultRuntimeConfig = new RuntimeConfig({
  reportFailure: () => undefined,
  supervisor: Supervisor.unsafeTrack(),
  flags: RuntimeConfigFlags.empty,
  yieldOpCount: 2048,
  logger: Logger.defaultString.map((s) => console.log(s)).filterLogLevel((level) => level >= LogLevel.Info),
});

/**
 * @tsplus static fncts.io.IOOps runtime
 */
export function runtime<R>(__tsplusTrace?: string): URIO<R, Runtime<R>> {
  return IO.environmentWithIO((environment: Environment<R>) =>
    IO.succeed(new Runtime(environment, defaultRuntimeConfig)),
  );
}

export const defaultRuntime = new Runtime(Environment.empty, defaultRuntimeConfig);

/**
 * @tsplus fluent fncts.io.IO unsafeRunAsync
 */
export const unsafeRunAsync = defaultRuntime.unsafeRunAsync;

/**
 * @tsplus fluent fncts.io.IO unsafeRunAsyncWith
 */
export const unsafeRunAsyncWith = defaultRuntime.unsafeRunAsyncWith;

/**
 * @tsplus fluent fncts.io.IO unsafeRunPromiseExit
 */
export const unsafeRunPromiseExit = defaultRuntime.unsafeRunPromiseExit;

/**
 * @tsplus fluent fncts.io.IO unsafeRunWith
 */
export const unsafeRunWith = defaultRuntime.unsafeRunWith;
