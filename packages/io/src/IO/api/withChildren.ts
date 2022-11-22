/**
 * @tsplus static fncts.io.IOOps withChildren
 */
export function withChildren<R, E, A>(
  get: (_: UIO<Conc<Fiber.Runtime<any, any>>>) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return Supervisor.track(false).flatMap((supervisor) =>
    get(supervisor.value.flatMap((children) => IO.fiberId.map((id) => children.filter((_) => _.id != id)))),
  );
}
