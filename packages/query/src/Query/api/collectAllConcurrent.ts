/**
 * @tsplus static fncts.query.QueryOps collectAllConcurrent
 */
export function collectAllConcurrent<R, E, A>(self: Iterable<Query<R, E, A>>, __tsplusTrace?: string): Query<R, E, Conc<A>> {
  return Query.foreachConcurrent(self, Function.identity);
}
