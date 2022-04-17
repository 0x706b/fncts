/**
 * @tsplus fluent fncts.io.IO scheduleFrom
 */
export function scheduleFrom<R, E, A extends A1, R1, A1, B>(
  self: IO<R, E, A>,
  a: Lazy<A>,
  schedule0: Lazy<Schedule<R1, A1, B>>,
): IO<R & R1, E, B> {
  return IO.defer(() => {
    const schedule = schedule0();
    return schedule.driver.flatMap((driver) => {
      const loop = (a: A1): IO<R & R1, E, B> =>
        driver.next(a).matchIO(
          () => driver.last.orHalt,
          () => self.flatMap(loop),
        );
      return loop(a());
    });
  });
}

/**
 * @tsplus fluent fncts.io.IO schedule
 */
export function schedule<R, E, A, R1, B>(
  io: IO<R, E, A>,
  schedule: Lazy<Schedule<R1, any, B>>,
  __tsplusTrace?: string,
): IO<R & R1, E, B> {
  return io.scheduleFrom(undefined, schedule);
}
