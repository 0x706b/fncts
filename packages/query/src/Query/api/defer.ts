/**
 * @tsplus static fncts.query.QueryOps defer
 */
export function defer<R, E, A>(query: Lazy<Query<R, E, A>>): Query<R, E, A> {
  return Query.unit.flatMap(() => query())
}
