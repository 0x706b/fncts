import { BlockedRequests } from "@fncts/query/internal/BlockedRequests";

/**
 * @tsplus pipeable fncts.query.Query zipWithConcurrent
 */
export function zipWithConcurrent<A, R1, E1, B, C>(
  that: Query<R1, E1, B>,
  f: (a: A, b: B) => C,
  __tsplusTrace?: string,
) {
  return <R, E>(self: Query<R, E, A>): Query<R | R1, E | E1, C> => {
    return new Query(
      self.step.zipWithConcurrent(that.step, (r1, r2) =>
        r1.matchType({
          Blocked: (br1, c1) =>
            r2.matchType({
              Blocked: (br2, c2) => Result.blocked(BlockedRequests.both<R | R1>(br1, br2), c1.zipWithConcurrent(c2, f)),
              Done: (b) =>
                Result.blocked(
                  br1,
                  c1.map((a) => f(a, b)),
                ),
              Fail: (cause) => Result.fail(cause),
            }),
          Done: (a) =>
            r2.matchType({
              Blocked: (br, c) =>
                Result.blocked(
                  br,
                  c.map((b) => f(a, b)),
                ),
              Done: (b) => Result.done(f(a, b)),
              Fail: (cause) => Result.fail(cause),
            }),
          Fail: (cause) =>
            r2.matchType({
              Blocked: () => Result.fail(cause),
              Done: () => Result.fail(cause),
              Fail: (cause2) => Result.fail(Cause.parallel(cause, cause2)),
            }),
        }),
      ),
    );
  };
}
