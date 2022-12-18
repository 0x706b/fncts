/**
 * @tsplus pipeable fncts.query.Query mapErrorCause
 */
export function mapErrorCause<E, E1>(f: (cause: Cause<E>) => Cause<E1>, __tsplusTrace?: string) {
  return <R, A>(self: Query<R, E, A>): Query<R, E1, A> => {
    return self.matchCauseQuery((c) => Query.failCauseNow(f(c)), Query.succeedNow);
  };
}
