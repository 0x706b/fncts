import { concrete } from "@fncts/io/Cached/definition";
import { CachedInternal } from "@fncts/io/Cached/internal";

/**
 * @tsplus static fncts.io.CachedOps auto
 */
export function auto<R, Error, Resource>(
  acquire: IO<R, Error, Resource>,
  policy: Schedule<any, any, any>,
  __tsplusTrace?: string,
): IO<R & Has<Scope>, never, Cached<Error, Resource>> {
  return IO.gen(function* (_) {
    const manual = yield* _(Cached.manual(acquire));
    yield* _(
      IO.acquireRelease(IO.interruptible(manual.refresh.schedule(policy)).forkDaemon, (fiber) => fiber.interrupt),
    );
    return manual;
  });
}

/**
 * @tsplus getter fncts.io.Cached get
 */
export function get_<Error, Resource>(self: Cached<Error, Resource>, __tsplusTrace?: string): FIO<Error, Resource> {
  concrete(self);
  return self.get;
}

/**
 * @tsplus static fncts.io.CachedOps manual
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
  constructor(readonly ref: ScopedRef<Exit<Error, Resource>>, readonly acquire: IO<Has<Scope>, Error, Resource>) {
    super();
  }
  get: FIO<Error, Resource> = this.ref.get.flatMap(IO.fromExitNow);
  refresh: FIO<Error, void> = this.ref.set(this.acquire.map(Exit.succeed));
}

/**
 * @tsplus getter fncts.io.Cached refresh
 */
export function refresh_<Error, Resource>(self: Cached<Error, Resource>, __tsplusTrace?: string): FIO<Error, void> {
  concrete(self);
  return self.refresh;
}
