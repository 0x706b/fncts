/**
 * @tsplus static fncts.query.QueryOps collectAllBatched
 */
export function collectAllBatched<R, E, A>(
  self: Iterable<Query<R, E, A>>,
  __tsplusTrace?: string,
): Query<R, E, Conc<A>> {
  return Query.foreachBatched(self, Function.identity);
}
