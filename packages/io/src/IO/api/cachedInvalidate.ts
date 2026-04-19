/**
 * Returns a cached version of this effect that expires after the specified duration.
 *
 * @tsplus pipeable fncts.io.IO cached
 */
export function cached(timeToLive: Lazy<Duration>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R, never, FIO<E, A>> => {
    return self.cachedInvalidate(timeToLive).map(([get]) => get);
  };
}
/**
 * Returns a cached effect with an invalidation function to clear the cache.
 *
 * @tsplus pipeable fncts.io.IO cachedInvalidate
 */
export function cachedInvalidate(timeToLive: Lazy<Duration>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R, never, readonly [FIO<E, A>, UIO<void>]> => {
    return IO.environmentWith((r) => {
      const ttl   = timeToLive().milliseconds;
      const cache = Ref.Synchronized.unsafeMake<Maybe<readonly [number, Future<E, A>]>>(Nothing());

      function compute(start: number): IO<R, never, Maybe<readonly [number, Future<E, A>]>> {
        return Do((Δ) => {
          const f = Δ(Future.make<E, A>());
          Δ(self.fulfill(f));
          return Just([start + ttl, f] as const);
        });
      }

      const get: IO<R, E, A> = IO.uninterruptibleMask((restore) =>
        Clock.currentTime.flatMap((time) =>
          cache
            .updateJustAndGetIO((m) =>
              m.match(
                () => Just(restore(compute(time))),
                ([end]) => (end - time <= 0 ? Just(restore(compute(time))) : Nothing()),
              ),
            )
            .flatMap((a) => a.getOrThrow[1].await),
        ),
      );

      return [get.provideEnvironment(r), cache.set(Nothing())];
    });
  };
}
