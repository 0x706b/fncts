/**
 * @tsplus static fncts.io.IOOps acquireRelease
 * @tsplus fluent fncts.io.IO acquireRelease
 */
export function acquireRelease<R, E, A, R1>(
  acquire: Lazy<IO<R, E, A>>,
  release: (a: A) => IO<R1, never, any>,
  __tsplusTrace?: string,
): IO<Scope | R | R1, E, A> {
  return IO.acquireReleaseExit(acquire, (a, _) => release(a));
}
