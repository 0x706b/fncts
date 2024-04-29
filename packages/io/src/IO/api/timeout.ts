/**
 * @tsplus pipeable fncts.io.IO timeoutTo
 */
export function timeoutTo<A, B, B1>(duration: Lazy<Duration>, b: Lazy<B>, f: (a: A) => B1, __tsplusTrace?: string) {
  return <R, E>(self: IO<R, E, A>): IO<R, E, B | B1> => {
    return IO.fiberIdWith((parentFiberId) =>
      self.raceFibersWith(
        IO.sleep(duration).interruptible,
        (winner, loser) =>
          winner.await.flatMap((exit) =>
            exit.match(
              (cause) => loser.interruptAs(parentFiberId) > IO.refailCause(cause),
              (a) => winner.inheritAll > loser.interruptAs(parentFiberId).as(f(a)),
            ),
          ),
        (winner, loser) =>
          winner.await.flatMap((exit) =>
            exit.match(
              (cause) => loser.interruptAs(parentFiberId) > IO.refailCause(cause),
              () => winner.inheritAll > loser.interruptAs(parentFiberId).as(b),
            ),
          ),
        null,
        FiberScope.global,
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.IO timeoutFail
 */
export function timeoutFail<E1>(duration: Lazy<Duration>, b: Lazy<E1>) {
  return <R, E, A>(self: IO<R, E, A>): IO<R, E | E1, A> =>
    self.timeoutTo(duration, IO.fail(b), (a) => IO.succeedNow(a)).flatten;
}

/**
 * @tsplus pipeable fncts.io.IO timeout
 */
export function timeout(duration: Lazy<Duration>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R, E, Maybe<A>> => {
    return self.timeoutTo(duration, Nothing(), Maybe.just);
  };
}
