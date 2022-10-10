/**
 * @tsplus static fncts.io.IOOps acquireReleaseExit
 * @tsplus fluent fncts.io.IO acquireReleaseExit
 */
export function acquireReleaseExit<R, E, A, R1>(
  acquire: Lazy<IO<R, E, A>>,
  release: (a: A, exit: Exit<any, any>) => IO<R1, never, any>,
  __tsplusTrace?: string,
): IO<Scope | R | R1, E, A> {
  return IO.uninterruptible(IO.defer(acquire).tap((a) => IO.addFinalizerExit((exit) => release(a, exit))));
}
