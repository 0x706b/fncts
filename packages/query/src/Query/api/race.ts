/**
 * @tsplus pipeable fncts.query.Query race
 */
export function race<R1, E1, A1>(that: Lazy<Query<R1, E1, A1>>, __tsplusTrace?: string) {
  return <R, E, A>(self: Query<R, E, A>): Query<R | R1, E | E1, A | A1> => {
    function race(
      query: Query<R | R1, E | E1, A | A1>,
      fiber: Fiber<never, Result<R | R1, E | E1, A | A1>>,
    ): Query<R | R1, E | E1, A | A1> {
      return new Query(query.step.raceWith(fiber.join, coordinate, coordinate));
    }
    function coordinate(
      exit: Exit<never, Result<R | R1, E | E1, A | A1>>,
      fiber: Fiber<never, Result<R | R1, E | E1, A | A1>>,
    ): IO<R | R1, never, Result<R | R1, E | E1, A | A1>> {
      return exit.match(
        (cause) => fiber.join.map((result) => result.mapErrorCause((c0) => Cause.both(c0, cause))),
        (result) =>
          result.matchType({
            Blocked: (blockedRequests, cont) =>
              cont.matchType({
                Effect: (query) => IO.succeedNow(Result.blocked(blockedRequests, Continue.effect(race(query, fiber)))),
                Get: (io) =>
                  IO.succeedNow(Result.blocked(blockedRequests, Continue.effect(race(Query.fromIO(io), fiber)))),
              }),
            Done: (value) => fiber.interrupt > IO.succeed(Result.done(value)),
            Fail: (cause) => fiber.join.map((result) => result.mapErrorCause((c0) => Cause.both(c0, cause))),
          }),
      );
    }

    return Query.defer(new Query(self.step.raceWith(that().step, coordinate, coordinate)));
  };
}
