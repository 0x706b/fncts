/**
 * @tsplus pipeable fncts.query.Query flatMap
 */
export function flatMap<A, R1, E1, B>(f: (a: A) => Query<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E>(self: Query<R, E, A>): Query<R | R1, E | E1, B> => {
    return new Query(
      self.step.flatMap((result) =>
        result.matchType({
          Blocked: (br, c) => IO.succeedNow(Result.blocked(br, c.mapQuery(f))),
          Done: (a) => f(a).step,
          Fail: (e) => IO.succeedNow(Result.fail(e)),
        }),
      ),
    );
  };
}

/**
 * @tsplus getter fncts.query.Query flatten
 */
export function flatten<R, E, R1, E1, A>(
  self: Query<R, E, Query<R1, E1, A>>,
  __tsplusTrace?: string,
): Query<R | R1, E | E1, A> {
  return self.flatMap(Function.identity);
}
