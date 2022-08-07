/**
 * @tsplus fluent fncts.io.IO withFinalizerExit
 */
export function withFinalizerExit_<R, E, A, R1>(
  self: IO<R, E, A>,
  finalizer: (a: A, exit: Exit<any, any>) => URIO<R1, any>,
  __tsplusTrace?: string,
): IO<R | R1 | Scope, E, A> {
  return IO.acquireReleaseExit(self, finalizer);
}
