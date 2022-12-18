/**
 * @tsplus pipeable fncts.query.Query matchCauseQuery
 */
export function matchCauseQuery<E, A, R1, E1, B, R2, E2, C>(
  failure: (cause: Cause<E>) => Query<R1, E1, B>,
  success: (a: A) => Query<R2, E2, C>,
) {
  return <R>(self: Query<R, E, A>): Query<R | R1 | R2, E1 | E2, B | C> => {
    return new Query(
      self.step.matchCauseIO(
        (cause) => failure(cause).step,
        (result) =>
          result.matchType({
            Blocked: (br, c) => IO.succeedNow(Result.blocked(br, c.matchCauseQuery(failure, success))),
            Done: (value) => success(value).step,
            Fail: (cause) => failure(cause).step,
          }),
      ),
    );
  };
}
