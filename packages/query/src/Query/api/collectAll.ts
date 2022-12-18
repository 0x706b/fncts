/**
 * @tsplus static fncts.query.QueryOps collectAll
 */
export function collectAll<R, E, A>(self: Iterable<Query<R, E, A>>, __tsplusTrace?: string): Query<R, E, Conc<A>> {
  return Query.foreach(self, Function.identity);
}
