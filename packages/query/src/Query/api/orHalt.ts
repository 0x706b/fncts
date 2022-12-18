/**
 * @tsplus pipeable fncts.query.Query orHaltWith
 */
export function orHaltWith<E>(f: (e: E) => unknown, __tsplusTrace?: string) {
  return <R, A>(self: Query<R, E, A>): Query<R, never, A> => {
    return self.matchQuery((e) => Query.haltNow(f(e)), Query.succeedNow);
  };
}

/**
 * @tsplus getter fncts.query.Query orHalt
 */
export function orHalt<R, E, A>(self: Query<R, E, A>, __tsplusTrace?: string): Query<R, never, A> {
  return self.orHaltWith(Function.identity);
}
