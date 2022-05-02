/**
 * @tsplus fluent fncts.io.IO ensuringChildren
 */
export function ensuringChildren<R, E, A, R1>(
  self: IO<R, E, A>,
  children: (_: Conc<Fiber.Runtime<any, any>>) => IO<R1, never, void>,
): IO<R & R1, E, A> {
  return Supervisor.track.flatMap((supervisor) =>
    self.supervised(supervisor).ensuring(supervisor.value.flatMap(children)),
  );
}
