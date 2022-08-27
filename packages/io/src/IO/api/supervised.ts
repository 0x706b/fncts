/**
 * @tsplus fluent fncts.io.IO supervised
 */
export function supervised<R, E, A>(
  self: IO<R, E, A>,
  supervisor: Lazy<Supervisor<any>>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return FiberRef.currentSupervisor.locallyWith((_) => _.zip(supervisor()))(self);
}
