/**
 * @tsplus pipeable fncts.io.IO retry
 */
export function retry<R1, E, O>(schedule0: Lazy<Schedule<R1, E, O>>, __tsplusTrace?: string) {
  return <R, A>(self: IO<R, E, A>): IO<R | R1, E, A> => self.retryOrElse(schedule0, (e, _) => IO.fail(e));
}

/**
 * @tsplus pipeable fncts.io.IO retryOrElse
 */
export function retryOrElse<E, A, R1, O, R2, E2>(
  schedule0: Lazy<Schedule<R1, E, O>>,
  orElse: (e: E, out: O) => IO<R2, E2, A>,
  __tsplusTrace?: string,
) {
  return <R>(self: IO<R, E, A>): IO<R | R1 | R2, E2, A> =>
    self.retryOrElseEither(schedule0, orElse).map((_) => _.value);
}

/**
 * @tsplus pipeable fncts.io.IO retryOrElseEither
 */
export function retryOrElseEither<E, R1, O, R2, E2, B>(
  schedule0: Lazy<Schedule<R1, E, O>>,
  orElse: (e: E, out: O) => IO<R2, E2, B>,
  __tsplusTrace?: string,
) {
  return <R, A>(self: IO<R, E, A>): IO<R | R1 | R2, E2, Either<B, A>> =>
    IO.defer(() => {
      const schedule = schedule0();
      const loop     = (driver: Schedule.Driver<unknown, R1, E, O>): IO<R | R1 | R2, E2, Either<B, A>> =>
        self.map(Either.right).catchAll((e) =>
          driver.next(e).matchIO(
            () => driver.last.orHalt.flatMap((out) => orElse(e, out).map(Either.left)),
            () => loop(driver),
          ),
        );
      return schedule.driver.flatMap(loop);
    });
}
