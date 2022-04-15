/**
 * @tsplus getter fncts.control.IO retry
 */
export function retry<R, E, A>(self: IO<R, E, A>) {
  return <R1, O>(schedule0: Lazy<Schedule<R1, E, O>>, __tsplusTrace?: string): IO<Has<Clock> & R & R1, E, A> =>
    self.retryOrElse(schedule0, (e, _) => IO.fail(e));
}

/**
 * @tsplus getter fncts.control.IO retryOrElse
 */
export function retryOrElse<R, E, A>(self: IO<R, E, A>) {
  return <R1, O, R2, E2>(
    schedule0: Lazy<Schedule<R1, E, O>>,
    orElse: (e: E, out: O) => IO<R2, E2, A>,
    __tsplusTrace?: string,
  ): IO<Has<Clock> & R & R1 & R2, E2, A> => self.retryOrElseEither(schedule0, orElse).map((_) => _.value);
}

/**
 * @tsplus getter fncts.control.IO retryOrElseEither
 */
export function retryOrElseEither_<R, E, A>(self: IO<R, E, A>) {
  return <R1, O, R2, E2, B>(
    schedule0: Lazy<Schedule<R1, E, O>>,
    orElse: (e: E, out: O) => IO<R2, E2, B>,
    __tsplusTrace?: string,
  ): IO<Has<Clock> & R & R1 & R2, E2, Either<B, A>> =>
    IO.serviceWithIO((clock) => clock.retryOrElseEither(self)(schedule0, orElse), Clock.Tag);
}
