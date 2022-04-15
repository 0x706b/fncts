/**
 * @tsplus fluent fncts.control.IO withFinalizerExit
 */
export function withFinalizerExit_<R, E, A, R1>(
  self: IO<R, E, A>,
  finalizer: (a: A, exit: Exit<any, any>) => URIO<R1, any>,
): IO<R & R1 & Has<Scope>, E, A> {
  return IO.acquireReleaseExit(self, finalizer);
}
