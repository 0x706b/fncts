/**
 * @tsplus static fncts.io.IOOps acquireRelease
 * @tsplus fluent fncts.io.IO acquireRelease
 */
export function acquireRelease<R, E, A, R1>(
  acquire: Lazy<IO<R, E, A>>,
  release: (a: A) => IO<R1, never, any>,
): IO<R | R1 | Scope, E, A> {
  return IO.acquireReleaseExit(acquire, (a, _) => release(a));
}
