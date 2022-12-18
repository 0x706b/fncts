/**
 * @tsplus static fncts.query.QueryOps foreachConcurrent
 */
export function foreachConcurrent<A, R, E, B>(
  self: Iterable<A>,
  f: (a: A) => Query<R, E, B>,
  __tsplusTrace?: string,
): Query<R, E, Conc<B>> {
  return new Query(IO.foreachConcurrent(self, (a) => f(a).step).map((results) => Result.collectAllConcurrent(results)));
}
