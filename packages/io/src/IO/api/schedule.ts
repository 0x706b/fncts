/**
 * @tsplus pipeable fncts.io.IO scheduleFrom
 */
export function scheduleFrom<A extends A1, R1, A1, B>(
  a: Lazy<A>,
  schedule0: Lazy<Schedule<R1, A1, B>>,
  __tsplusTrace?: string,
) {
  return <R, E>(self: IO<R, E, A>): IO<R | R1, E, B> => {
    return IO.defer(() => {
      const schedule = schedule0();
      return schedule.driver.flatMap((driver) => {
        const loop = (a: A1): IO<R | R1, E, B> =>
          driver.next(a).matchIO(
            () => driver.last.orHalt,
            () => self.flatMap(loop),
          );
        return loop(a());
      });
    });
  };
}

/**
 * @tsplus pipeable fncts.io.IO schedule
 */
export function schedule<R1, B>(schedule: Lazy<Schedule<R1, any, B>>, __tsplusTrace?: string) {
  return <R, E, A>(io: IO<R, E, A>): IO<R | R1, E, B> => {
    return io.scheduleFrom(undefined, schedule);
  };
}
