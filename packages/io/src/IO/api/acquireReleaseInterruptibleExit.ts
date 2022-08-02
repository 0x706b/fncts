/**
 * @tsplus static fncts.io.IOOps acquireReleaseInterruptibleExit
 */
export function acquireReleaseInterruptibleExit<R, E, A, R1>(
  acquire: Lazy<IO<R, E, A>>,
  release: (exit: Exit<any, any>) => IO<R1, never, any>,
  __tsplusTrace?: string,
): IO<R | R1 | Scope, E, A> {
  return IO.defer(acquire).ensuring(IO.addFinalizerExit(release));
}
