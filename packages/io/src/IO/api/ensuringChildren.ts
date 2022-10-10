/**
 * @tsplus pipeable fncts.io.IO ensuringChildren
 */
export function ensuringChildren<R1>(
  children: (_: Conc<Fiber.Runtime<any, any>>) => IO<R1, never, void>,
  __tsplusTrace?: string,
) {
  return <R, E, A>(self: IO<R, E, A>): IO<R | R1, E, A> => {
    return Supervisor.track(true).flatMap((supervisor) =>
      self.supervised(supervisor).ensuring(supervisor.value.flatMap(children)),
    );
  };
}
