import { Console } from "@fncts/base/control/Console";
import { FiberContext } from "@fncts/base/control/Fiber";
import { concrete } from "@fncts/base/control/IO/definition";
import { Stack } from "@fncts/base/internal/Stack";

export class Runtime<R> {
  constructor(readonly environment: R, readonly runtimeConfig: RuntimeConfig) {}

  unsafeRunWith = <E, A>(
    io: IO<R, E, A>,
    k: (exit: Exit<E, A>) => any,
    __tsplusTrace?: string,
  ): ((fiberId: FiberId) => (f: (exit: Exit<E, A>) => any) => void) => {
    const fiberId = FiberId.newFiberId();

    const children = new Set<FiberContext<any, any>>();

    const supervisor = this.runtimeConfig.supervisor;

    const context = new FiberContext<E, A>(
      fiberId,
      this.runtimeConfig,
      Stack.make(InterruptStatus.interruptible.toBoolean),
      new Map([[FiberRef.currentEnvironment, this.environment]]),
      children,
    );

    FiberScope.global.unsafeAdd(context);

    if (supervisor !== Supervisor.none) {
      supervisor.unsafeOnStart(this.environment, io, Nothing(), context);

      context.unsafeOnDone((exit) => supervisor.unsafeOnEnd(exit.flatten, context));
    }

    context.nextIO = concrete(io);
    context.run();
    context.unsafeOnDone((exit) => k(exit.flatten));
    return (fiberId) => (k) =>
      this.unsafeRunAsyncWith(context.interruptAs(fiberId), (exit) => k(exit.flatten));
  };

  unsafeRunAsync = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string) => {
    this.unsafeRunAsyncWith(io, () => void 0);
  };

  unsafeRunAsyncWith = <E, A>(
    io: IO<R, E, A>,
    k: (exit: Exit<E, A>) => any,
    __tsplusTrace?: string,
  ) => {
    this.unsafeRunWith(io, k);
  };

  unsafeRunPromiseExit = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): Promise<Exit<E, A>> =>
    new Promise((resolve) => {
      this.unsafeRunAsyncWith(io, resolve);
    });
}

/**
 * @tsplus static fncts.control.IOOps runtime
 */
export function runtime<R>(__tsplusTrace?: string): URIO<R, Runtime<R>> {
  return IO.environmentWithIO((environment: R) =>
    IO.runtimeConfig.map((config) => new Runtime(environment, config)),
  );
}

export const defaultRuntimeConfig = new RuntimeConfig({
  reportFailure: () => undefined,
  supervisor: Supervisor.unsafeTrack(),
  flags: RuntimeConfigFlags.empty,
  yieldOpCount: 2048,
  logger: Logger.defaultString
    .map((s) => console.log(s))
    .filterLogLevel((level) => level >= LogLevel.Info),
});

export const defaultRuntime = new Runtime(
  Clock.Tag.of(Clock.Live) & Random.Tag.of(Random.Live) & Console.Tag.of(Console.Live),
  defaultRuntimeConfig,
);

/**
 * @tsplus fluent fncts.control.IO unsafeRunAsync
 */
export const unsafeRunAsync = defaultRuntime.unsafeRunAsync;

/**
 * @tsplus fluent fncts.control.IO unsafeRunAsyncWith
 */
export const unsafeRunAsyncWith = defaultRuntime.unsafeRunAsyncWith;

/**
 * @tsplus fluent fncts.control.IO unsafeRunPromiseExit
 */
export const unsafeRunPromiseExit = defaultRuntime.unsafeRunPromiseExit;

/**
 * @tsplus fluent fncts.control.IO unsafeRunWith
 */
export const unsafeRunWith = defaultRuntime.unsafeRunWith;
