/**
 * @tsplus pipeable fncts.query.Query ensuring
 */
export function ensuring<R1>(finalizer: Query<R1, never, any>, __tsplusTrace?: string) {
  return <R, E, A>(self: Query<R, E, A>): Query<R | R1, E, A> => {
    return self.matchCauseQuery(
      (cause1) =>
        finalizer.matchCauseQuery(
          (cause2) => Query.failCauseNow(Cause.then(cause1, cause2)),
          () => Query.failCauseNow(cause1),
        ),
      (value) =>
        finalizer.matchCauseQuery(
          (cause) => Query.failCauseNow(cause),
          () => Query.succeedNow(value),
        ),
    );
  };
}
