/**
 * @tsplus getter fncts.io.IO repeat
 */
export function repeat_<R, E, A>(self: IO<R, E, A>) {
  return <R1, B>(schedule0: Lazy<Schedule<R1, A, B>>, __tsplusTrace?: string): IO<R | R1, E, B> =>
    self.repeatOrElse(schedule0, (e, _) => IO.fail(e));
}

/**
 * @tsplus getter fncts.io.IO repeatOrElse
 */
export function repeatOrElse_<R, E, A>(self: IO<R, E, A>) {
  return <R1, B, R2, E2>(
    schedule0: Lazy<Schedule<R1, A, B>>,
    orElse: (e: E, out: Maybe<B>) => IO<R2, E2, B>,
    __tsplusTrace?: string,
  ): IO<R | R1 | R2, E2, B> => self.repeatOrElseEither(schedule0, orElse).map((_) => _.value);
}

/**
 * @tsplus getter fncts.io.IO repeatOrElseEither
 */
export function repeatOrElseEither_<R, E, A>(self: IO<R, E, A>) {
  return <R1, B, R2, E2, C>(
    schedule0: Lazy<Schedule<R1, A, B>>,
    orElse: (e: E, out: Maybe<B>) => IO<R2, E2, C>,
    __tsplusTrace?: string,
  ): IO<R | R1 | R2, E2, Either<C, B>> =>
    IO.defer(() => {
      const schedule = schedule0();

      return schedule.driver.flatMap((driver) => {
        const loop = (a: A): IO<R | R1 | R2, E2, Either<C, B>> =>
          driver.next(a).matchIO(
            () => driver.last.orHalt.map(Either.right),
            (b) =>
              self.matchIO(
                (e) => orElse(e, Just(b)).map(Either.left),
                (a) => loop(a),
              ),
          );

        return self.matchIO(
          (e) => orElse(e, Nothing()).map(Either.left),
          (a) => loop(a),
        );
      });
    });
}
