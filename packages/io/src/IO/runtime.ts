import { FiberMessage, FiberRuntime } from "@fncts/io/Fiber";
import { FiberRefs } from "@fncts/io/FiberRefs";
import { IOEnv } from "@fncts/io/IOEnv/definition";
import { RuntimeFlag } from "@fncts/io/RuntimeFlag";
import { RuntimeFlags } from "@fncts/io/RuntimeFlags";

import { StagedScheduler } from "../internal/Scheduler.js";

export class Runtime<R> {
  constructor(
    readonly environment: Environment<R>,
    readonly runtimeFlags: RuntimeFlags,
    readonly fiberRefs: FiberRefs,
  ) {}

  unsafeRunFiber = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): FiberRuntime<E, A> => {
    const fiberId   = FiberId.unsafeMake(TraceElement.parse(__tsplusTrace));
    const fiberRefs = this.fiberRefs.updatedAs(fiberId, FiberRef.currentEnvironment, this.environment);

    const fiber = new FiberRuntime<E, A>(
      fiberId,
      fiberRefs,
      RuntimeFlags(RuntimeFlag.Interruption, RuntimeFlag.CooperativeYielding),
    );

    const supervisor = fiber.getSupervisor();

    if (supervisor != Supervisor.none) {
      supervisor.unsafeOnStart(this.environment, io, Nothing(), fiber);
      fiber.addObserver((exit) => supervisor.unsafeOnEnd(exit, fiber));
    }

    FiberScope.global.unsafeAdd(fiber);

    fiber.start(io);

    return fiber;
  };

  unsafeRunWith = <E, A>(
    io: IO<R, E, A>,
    k: (exit: Exit<E, A>) => any,
    __tsplusTrace?: string,
  ): ((fiberId: FiberId) => (f: (exit: Exit<E, A>) => any) => void) => {
    const fiber = this.unsafeRunFiber(io);
    fiber.tell(FiberMessage.Stateful((fiber) => fiber.addObserver(k)));
    return (fiberId) => (k) => this.unsafeRunAsyncWith(fiber.interruptAs(fiberId), (exit) => k(exit.flatten));
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

  unsafeRunSyncExit = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): Exit<E, A> => {
    const fiberId   = FiberId.unsafeMake(TraceElement.parse(__tsplusTrace));
    const scheduler = new StagedScheduler();
    const fiberRefs = this.fiberRefs.updatedAs(fiberId, FiberRef.currentEnvironment, this.environment);
    const fiber     = new FiberRuntime<E, A>(
      fiberId,
      fiberRefs,
      RuntimeFlags(RuntimeFlag.Interruption, RuntimeFlag.CooperativeYielding),
    );

    FiberScope.global.unsafeAdd(fiber);

    const supervisor = fiber.getSupervisor();

    if (supervisor != Supervisor.none) {
      supervisor.unsafeOnStart(this.environment, io, Nothing(), fiber);
      fiber.addObserver((exit) => supervisor.unsafeOnEnd(exit, fiber));
    }

    fiber.start(io);
    scheduler.flush();

    const result = fiber.exitValue();
    if (result !== null) {
      return result;
    }

    return Exit.halt(fiber);
  };
}

/**
 * @tsplus static fncts.io.IOOps runtime
 */
export function runtime<R>(__tsplusTrace?: string): URIO<R, Runtime<R>> {
  return IO.withFiberRuntime<R, never, Runtime<R>>((state, status) =>
    IO(
      new Runtime<R>(
        state.getFiberRef(FiberRef.currentEnvironment) as Environment<R>,
        status.runtimeFlags,
        state.getFiberRefs(),
      ),
    ),
  );
}

export const defaultRuntime = new Runtime(
  Environment.empty,
  RuntimeFlags.default,
  new FiberRefs(HashMap.makeDefault()),
);

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

/**
 * @tsplus getter fncts.io.IO unsafeRunSyncExit
 */
export const unsafeRunSyncExit = defaultRuntime.unsafeRunSyncExit;
