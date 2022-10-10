/**
 *
 * Returns an IO with the behavior of this one, but where all child
 * fibers forked in the effect are reported to the specified supervisor.
 *
 * @tsplus pipeable fncts.io.IO supervised
 */
export function supervised(supervisor: Supervisor<any>, __tsplusTrace?: string) {
  return <R, E, A>(fa: IO<R, E, A>): IO<R, E, A> => {
    return FiberRef.currentSupervisor.locally(supervisor)(fa);
  };
}
