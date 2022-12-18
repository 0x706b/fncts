/**
 * @tsplus pipeable fncts.query.Query bimap
 */
export function bimap<E, A, E1, B>(failure: (e: E) => E1, success: (a: A) => B, __tsplusTrace?: string) {
  return <R>(self: Query<R, E, A>): Query<R, E1, B> => {
    return self.matchQuery(
      (e) => Query.failNow(failure(e)),
      (a) => Query.succeedNow(success(a)),
    );
  };
}
