import type { Exit } from "../../data/Exit";
import type { Has } from "../../prelude";
import type { URIO } from "./definition";

import { FiberId } from "../../data/FiberId";
import { InterruptStatus } from "../../data/InterruptStatus";
import { LogLevel } from "../../data/LogLevel";
import { Nothing } from "../../data/Maybe";
import { RuntimeConfig, RuntimeConfigFlags } from "../../data/RuntimeConfig";
import { Stack } from "../../internal/Stack";
import { Clock } from "../Clock";
import { FiberContext } from "../Fiber";
import { Logger } from "../Logger";
import { Scope } from "../Scope";
import { Supervisor } from "../Supervisor";
import { concrete, IO } from "./definition";

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
      new Map(),
      children,
    );

    Scope.global.unsafeAdd(context);

    if (supervisor !== Supervisor.none) {
      supervisor.unsafeOnStart(this.environment, io, Nothing(), context);

      context.unsafeOnDone((exit) => supervisor.unsafeOnEnd(exit.flatten, context));
    }

    context.nextIO = concrete(io);
    context.run();
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
 * @tsplus static fncts.control.IOOps runtime
 */
export function runtime<R>(__tsplusTrace?: string): URIO<R, Runtime<R>> {
  return IO.asksIO((environment: R) => IO.runtimeConfig.map((config) => new Runtime(environment, config)));
}

export const defaultRuntimeConfig = new RuntimeConfig({
  reportFailure: () => undefined,
  supervisor: Supervisor.unsafeTrack(),
  flags: RuntimeConfigFlags.empty,
  yieldOpCount: 2048,
  logger: Logger.defaultString.map((s) => console.log(s)).filterLogLevel((level) => level >= LogLevel.Info),
});

export const defaultRuntime = new Runtime(
  {
    [Clock.Tag.key]: Clock.Live,
  } as unknown as Has<Clock>,
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