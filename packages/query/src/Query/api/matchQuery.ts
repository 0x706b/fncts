/**
 * @tsplus pipeable fncts.query.Query matchQuery
 */
export function matchQuery<E, A, R1, E1, B, R2, E2, C>(
  failure: (e: E) => Query<R1, E1, B>,
  success: (a: A) => Query<R2, E2, C>,
  __tsplusTrace?: string,
) {
  return <R>(self: Query<R, E, A>): Query<R | R1 | R2, E1 | E2, B | C> => {
    return self.matchCauseQuery((cause) => cause.failureOrCause.match(failure, Query.failCauseNow), success);
  };
}
