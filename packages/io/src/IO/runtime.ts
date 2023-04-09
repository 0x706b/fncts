import { IOError } from "@fncts/base/data/exceptions";
import { FiberRuntime } from "@fncts/io/Fiber";
import { FiberRefs } from "@fncts/io/FiberRefs";
import { RuntimeFlag } from "@fncts/io/RuntimeFlag";
import { RuntimeFlags } from "@fncts/io/RuntimeFlags";

import { StagedScheduler } from "../internal/Scheduler.js";

export class Runtime<R> {
  constructor(
    readonly environment: Environment<R>,
    readonly runtimeFlags: RuntimeFlags,
    readonly fiberRefs: FiberRefs,
  ) {}

  makeFiber = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): FiberRuntime<E, A> => {
    const fiberId   = FiberId.unsafeMake(__tsplusTrace);
    const fiberRefs = this.fiberRefs.updateAs(fiberId, FiberRef.currentEnvironment, this.environment);

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

    FiberScope.global.unsafeAdd(null!, fiber.runtimeFlags0, fiber);

    return fiber;
  };

  unsafeRunFiber = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): FiberRuntime<E, A> => {
    const fiber = this.makeFiber(io);
    fiber.start(io);
    return fiber;
  };

  unsafeRunPromiseExit = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): Promise<Exit<E, A>> => {
    return new Promise((resolve) => {
      const fiber = this.makeFiber(io);
      fiber.addObserver((exit) => {
        resolve(exit);
      });
      fiber.start(io);
    });
  };

  unsafeRunPromise = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): Promise<A> => {
    return new Promise((resolve, reject) => {
      const fiber = this.makeFiber(io);
      fiber.addObserver((exit) => {
        if (exit.isFailure()) {
          reject(new IOError(exit.cause));
        } else {
          resolve(exit.value);
        }
      });
    });
  };

  unsafeRunOrFork = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): Either<Fiber.Runtime<E, A>, Exit<E, A>> => {
    const fiberId   = FiberId.unsafeMake(__tsplusTrace);
    const scheduler = new StagedScheduler();
    const fiberRefs = this.fiberRefs.updateAs(fiberId, FiberRef.currentEnvironment, this.environment);
    const fiber     = new FiberRuntime<E, A>(
      fiberId,
      fiberRefs,
      RuntimeFlags(RuntimeFlag.Interruption, RuntimeFlag.CooperativeYielding),
    );

    FiberScope.global.unsafeAdd(null!, fiber.runtimeFlags0, fiber);

    const supervisor = fiber.getSupervisor();

    if (supervisor != Supervisor.none) {
      supervisor.unsafeOnStart(this.environment, io, Nothing(), fiber);
      fiber.addObserver((exit) => supervisor.unsafeOnEnd(exit, fiber));
    }

    fiber.start(io);
    scheduler.flush();

    const result = fiber.exitValue();
    if (result !== null) {
      return Either.right(result);
    }

    return Either.left(fiber);
  };

  unsafeRun = <E, A>(io: IO<R, E, A>, __tsplusTrace?: string): Exit<E, A> => {
    return this.unsafeRunOrFork(io).match(() => {
      throw new Error("Encountered async boundary");
    }, Function.identity);
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

export const defaultRuntime = new Runtime(Environment.empty, RuntimeFlags.default, FiberRefs(HashMap()));

/**
 * @tsplus fluent fncts.io.IO unsafeRunFiber
 */
export const unsafeRunFiber = defaultRuntime.unsafeRunFiber;

/**
 * @tsplus fluent fncts.io.IO unsafeRunPromiseExit
 */
export const unsafeRunPromiseExit = defaultRuntime.unsafeRunPromiseExit;

/**
 * @tsplus getter fncts.io.IO unsafeRunOrFork
 */
export const unsafeRunOrFork = defaultRuntime.unsafeRunOrFork;

/**
 * @tsplus getter fncts.io.IO unsafeRun
 */
export const unsafeRun = defaultRuntime.unsafeRun;
