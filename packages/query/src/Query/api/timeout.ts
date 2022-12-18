/**
 * @tsplus pipeable fncts.query.Query timeoutTo
 */
export function timeoutTo<A, B, B1>(duration: Lazy<Duration>, b: Lazy<B>, f: (a: A) => B1, __tsplusTrace?: string) {
  return <R, E>(self: Query<R, E, A>): Query<R, E, B | B1> => {
    function race(query: Query<R, E, B | B1>, fiber: Fiber<never, B | B1>): Query<R, E, B | B1> {
      return new Query(
        query.step.raceWith(
          fiber.join,
          (leftExit, rightFiber) =>
            leftExit.match(
              (cause) => rightFiber.interrupt > IO.succeedNow(Result.fail(cause)),
              (result) =>
                result.matchType({
                  Blocked: (br, c) =>
                    c.matchType({
                      Effect: (query) => IO.succeedNow(Result.blocked(br, Continue.effect(race(query, fiber)))),
                      Get: (io) => IO.succeedNow(Result.blocked(br, Continue.effect(race(Query.fromIO(io), fiber)))),
                    }),
                  Done: (value) => rightFiber.interrupt > IO.succeedNow(Result.done(value)),
                  Fail: (cause) => rightFiber.interrupt > IO.succeed(Result.fail(cause)),
                }),
            ),
          (rightExit, leftFiber) => leftFiber.interrupt > IO.succeedNow(Result.fromExit(rightExit)),
        ),
      );
    }

    return Query.fromIO(IO.sleep(duration).interruptible.as(b).fork).flatMap((fiber) => race(self.map(f), fiber));
  };
}

/**
 * @tsplus pipeable fncts.query.Query timeout
 */
export function timeout(duration: Lazy<Duration>, __tsplusTrace?: string) {
  return <R, E, A>(self: Query<R, E, A>): Query<R, E, Maybe<A>> => {
    return self.timeoutTo(duration, Nothing(), (a) => Just(a));
  };
}

/**
 * @tsplus pipeable fncts.query.Query timeoutFail
 */
export function timeoutFail<E1>(duration: Lazy<Duration>, e: Lazy<E1>, __tsplusTrace?: string) {
  return <R, E, A>(self: Query<R, E, A>): Query<R, E | E1, A> => {
    return self.timeoutTo(duration, Query.fail(e), Query.succeedNow).flatten;
  };
}

/**
 * @tsplus pipeable fncts.query.Query timeoutFailCause
 */
export function timeoutFailCause<E1>(duration: Lazy<Duration>, e: Lazy<Cause<E1>>, __tsplusTrace?: string) {
  return <R, E, A>(self: Query<R, E, A>): Query<R, E | E1, A> => {
    return self.timeoutTo(duration, Query.failCause(e), Query.succeedNow).flatten;
  };
}
