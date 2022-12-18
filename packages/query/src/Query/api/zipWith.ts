import { BlockedRequests } from "@fncts/query/internal/BlockedRequests";

/**
 * @tsplus pipeable fncts.query.Query zipWith
 */
export function zipWith<A, R1, E1, B, C>(that: Lazy<Query<R1, E1, B>>, f: (a: A, b: B) => C, __tsplusTrace?: string) {
  return <R, E>(self: Query<R, E, A>): Query<R | R1, E | E1, C> => {
    return new Query(
      self.step.flatMap((result) =>
        result.matchType({
          Blocked: (br, cont) =>
            cont.matchType({
              Effect: (query) => IO.succeedNow(Result.blocked(br, Continue.effect(query.zipWith(that, f)))),
              Get: () =>
                that().step.map((result) =>
                  result.matchType({
                    Blocked: (br2, c2) => Result.blocked(BlockedRequests.then<R | R1>(br, br2), cont.zipWith(c2, f)),
                    Done: (b) =>
                      Result.blocked(
                        br,
                        cont.map((a) => f(a, b)),
                      ),
                    Fail: (cause) => Result.fail(cause),
                  }),
                ),
            }),
          Done: (a) =>
            that().step.map((result) =>
              result.matchType({
                Blocked: (br, c) =>
                  Result.blocked(
                    br,
                    c.map((b) => f(a, b)),
                  ),
                Done: (b) => Result.done(f(a, b)),
                Fail: (cause) => Result.fail(cause),
              }),
            ),
          Fail: (cause) => Result.fail(cause),
        }),
      ),
    );
  };
}
