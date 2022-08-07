/**
 * @tsplus getter fncts.io.IO retry
 */
export function retry<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string) {
  return <R1, O>(schedule0: Lazy<Schedule<R1, E, O>>, __tsplusTrace?: string): IO<R | R1, E, A> =>
    self.retryOrElse(schedule0, (e, _) => IO.fail(e));
}

/**
 * @tsplus getter fncts.io.IO retryOrElse
 */
export function retryOrElse<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string) {
  return <R1, O, R2, E2>(
    schedule0: Lazy<Schedule<R1, E, O>>,
    orElse: (e: E, out: O) => IO<R2, E2, A>,
    __tsplusTrace?: string,
  ): IO<R | R1 | R2, E2, A> => self.retryOrElseEither(schedule0, orElse).map((_) => _.value);
}

/**
 * @tsplus getter fncts.io.IO retryOrElseEither
 */
export function retryOrElseEither_<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string) {
  return <R1, O, R2, E2, B>(
    schedule0: Lazy<Schedule<R1, E, O>>,
    orElse: (e: E, out: O) => IO<R2, E2, B>,
    __tsplusTrace?: string,
  ): IO<R | R1 | R2, E2, Either<B, A>> =>
    IO.defer(() => {
      const schedule = schedule0();

      const loop = (driver: Schedule.Driver<unknown, R1, E, O>): IO<R | R1 | R2, E2, Either<B, A>> =>
        self.map(Either.right).catchAll((e) =>
          driver.next(e).matchIO(
            () => driver.last.orHalt.flatMap((out) => orElse(e, out).map(Either.left)),
            () => loop(driver),
          ),
        );

      return schedule.driver.flatMap(loop);
    });
}
