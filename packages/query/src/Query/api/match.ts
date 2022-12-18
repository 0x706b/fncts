/**
 * @tsplus pipeable fncts.query.Query match
 */
export function match<E, A, B, C>(failure: (e: E) => B, success: (a: A) => C) {
  return <R>(self: Query<R, E, A>): Query<R, never, B | C> => {
    return self.matchQuery(
      (e) => Query.succeedNow(failure(e)),
      (a) => Query.succeedNow(success(a)),
    );
  };
}
