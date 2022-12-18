/**
 * @tsplus pipeable fncts.query.Query catchAllCause
 */
export function catchAllCause<E, R1, E1, B>(f: (cause: Cause<E>) => Query<R1, E1, B>, __tsplusTrace?: string) {
  return <R, A>(self: Query<R, E, A>): Query<R | R1, E1, A | B> => {
    return self.matchCauseQuery(f, Query.succeedNow);
  };
}

/**
 * @tsplus pipeable fncts.query.Query catchAll
 */
export function catchAll<E, R1, E1, B>(f: (e: E) => Query<R1, E1, B>, __tsplusTrace?: string) {
  return <R, A>(self: Query<R, E, A>): Query<R | R1, E1, A | B> => {
    return self.matchQuery(f, Query.succeedNow);
  };
}
