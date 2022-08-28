/**
 *
 * Returns an IO with the behavior of this one, but where all child
 * fibers forked in the effect are reported to the specified supervisor.
 *
 * @tsplus fluent fncts.io.IO supervised
 */
export function supervised_<R, E, A>(
  fa: IO<R, E, A>,
  supervisor: Supervisor<any>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return FiberRef.currentSupervisor.locally(supervisor)(fa);
}
