/**
 * @tsplus static fncts.io.IOOps acquireReleaseInterruptible
 */
export function acquireReleaseInterruptible<R, E, A, R1>(
  acquire: Lazy<IO<R, E, A>>,
  release: IO<R1, never, any>,
  __tsplusTrace?: string,
): IO<R | R1 | Scope, E, A> {
  return IO.acquireReleaseInterruptibleExit(acquire, () => release);
}
