/**
 * @tsplus static fncts.control.IOOps withChildren
 */
export function withChildren<R, E, A>(
  get: (_: UIO<Conc<Fiber.Runtime<any, any>>>) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return Supervisor.track.chain((supervisor) =>
    get(
      supervisor.value.chain((children) => IO.descriptor.map((d) => children.filter((_) => _.id != d.id))),
    ).supervised(supervisor),
  );
}
