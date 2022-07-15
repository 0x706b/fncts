import { AtomicReference } from "@fncts/base/internal/AtomicReference";
import { Stack } from "@fncts/base/internal/Stack";
import { FiberContext } from "@fncts/io/Fiber";
import { concrete } from "@fncts/io/IO/definition";
import { IOEnv } from "@fncts/io/IOEnv/definition";

export class Runtime<R> {
  constructor(readonly environment: Environment<R>, readonly runtimeConfig: RuntimeConfig) {}

  unsafeRunFiber = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): FiberContext<E, A> => {
    const fiberId    = FiberId.unsafeMake(TraceElement.parse(__tsplusTrace));
    const children   = new Set<FiberContext<any, any>>();
    const supervisor = this.runtimeConfig.supervisor;
    const context    = new FiberContext<E, A>(
      fiberId,
      this.runtimeConfig,
      Stack.single(InterruptStatus.interruptible.toBoolean),
      new AtomicReference(
        HashMap<FiberRef<unknown>, Cons<readonly [FiberId.Runtime, unknown]>>(
          [FiberRef.currentEnvironment, Cons([fiberId, this.environment])],
          [IOEnv.services, Cons([fiberId, IOEnv.environment])],
        ),
      ),
      children,
    );

    FiberScope.global.unsafeAdd(context);

    if (supervisor !== Supervisor.none) {
      supervisor.unsafeOnStart(this.environment, io, Nothing(), context);

      context.unsafeOnDone((exit) => supervisor.unsafeOnEnd(exit.flatten, context));
    }

    context.nextIO = concrete(io);
    context.run();
    return context;
  };

  unsafeRunWith = <E, A>(
    io: IO<R, E, A>,
    k: (exit: Exit<E, A>) => any,
    __tsplusTrace?: string,
  ): ((fiberId: FiberId) => (f: (exit: Exit<E, A>) => any) => void) => {
    const context = this.unsafeRunFiber(io);
    context.unsafeOnDone((exit) => k(exit.flatten));
    return (fiberId) => (k) => this.unsafeRunAsyncWith(context.interruptAs(fiberId), (exit) => k(exit.flatten));
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

/**
 * @tsplus static fncts.io.IOOps runtime
 */
export function runtime<R>(__tsplusTrace?: string): URIO<R, Runtime<R>> {
  return IO.environmentWithIO((environment: Environment<R>) =>
    IO.runtimeConfig.map((config) => new Runtime(environment, config)),
  );
}

export const defaultRuntimeConfig = new RuntimeConfig({
  reportFailure: () => undefined,
  supervisor: Supervisor.unsafeTrack(),
  flags: RuntimeConfigFlags.empty,
  yieldOpCount: 2048,
  logger: Logger.defaultString.map((s) => console.log(s)).filterLogLevel((level) => level >= LogLevel.Info),
});

export const defaultRuntime = new Runtime(Environment.empty, defaultRuntimeConfig);

/**
 * @tsplus fluent fncts.io.IO unsafeRunFiber
 */
export const unsafeRunFiber = defaultRuntime.unsafeRunFiber;

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
