import type { Has } from "../../prelude.js";
import type { Clock } from "../Clock.js";
import type { FIO } from "../IO/definition.js";
import type { Schedule } from "../Schedule.js";
import type { Scope } from "../Scope.js";

import { Exit } from "../../data.js";
import { IO } from "../IO.js";
import { ScopedRef } from "../ScopedRef.js";
import { Cached, concrete } from "./definition.js";
import { CachedInternal } from "./internal.js";

/**
 * @tsplus static fncts.control.CachedOps auto
 */
export function auto<R, Error, Resource>(
  acquire: IO<R, Error, Resource>,
  policy: Schedule<any, any, any>,
  __tsplusTrace?: string,
): IO<R & Has<Clock> & Has<Scope>, never, Cached<Error, Resource>> {
  return IO.gen(function* (_) {
    const manual = yield* _(Cached.manual(acquire));
    yield* _(
      IO.acquireRelease(
        IO.interruptible(manual.refresh.schedule(policy)).forkDaemon,
        (fiber) => fiber.interrupt,
      ),
    );
    return manual;
  });
}

/**
 * @tsplus getter fncts.control.Cached get
 */
export function get_<Error, Resource>(self: Cached<Error, Resource>, __tsplusTrace?: string): FIO<Error, Resource> {
  concrete(self);
  return self.get;
}

/**
 * @tsplus static fncts.control.CachedOps manual
 */
export function manual<R, Error, Resource>(
  acquire: IO<R, Error, Resource>,
): IO<R & Has<Scope>, never, Cached<Error, Resource>> {
  return IO.gen(function* (_) {
    const env = yield* _(IO.environment<R>());
    const ref = yield* _(ScopedRef.fromAcquire(acquire.result));
    return new Manual(ref, acquire.provideEnvironment(env));
  });
}

class Manual<Error, Resource> extends CachedInternal<Error, Resource> {
  constructor(
    readonly ref: ScopedRef<Exit<Error, Resource>>,
    readonly acquire: IO<Has<Scope>, Error, Resource>,
  ) {
    super();
  }
  get: FIO<Error, Resource> = this.ref.get.chain(IO.fromExitNow);
  refresh: FIO<Error, void> = this.ref.set(this.acquire.map(Exit.succeed));
}

/**
 * @tsplus getter fncts.control.Cached refresh
 */
export function refresh_<Error, Resource>(self: Cached<Error, Resource>, __tsplusTrace?: string): FIO<Error, void> {
  concrete(self);
  return self.refresh;
}
