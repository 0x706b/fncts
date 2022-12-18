/**
 * @tsplus pipeable fncts.query.Query runCache
 */
export function runCache(cache: Cache, __tsplusTrace?: string) {
  return <R, E, A>(self: Query<R, E, A>): IO<R, E, A> => {
    return IO.defer(
      Query.currentCache.locally(cache)(
        self.step.flatMap((result) =>
          result.matchType({
            Blocked: (br, c) =>
              c.matchType({
                Effect: (c) => br.run > c.run,
                Get: (io) => br.run > io,
              }),
            Done: (a) => IO.succeedNow(a),
            Fail: (cause) => IO.failCauseNow(cause),
          }),
        ),
      ),
    );
  };
}

/**
 * @tsplus getter fncts.query.Query runLog
 */
export function runLog<R, E, A>(self: Query<R, E, A>, __tsplusTrace?: string): IO<R, E, readonly [Cache, A]> {
  return Do((Δ) => {
    const cache = Δ(Cache.empty());
    const a     = Δ(self.runCache(cache));
    return [cache, a] as const;
  });
}

/**
 * @tsplus getter fncts.query.Query run
 */
export function run<R, E, A>(self: Query<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return self.runLog.map(([, a]) => a);
}
