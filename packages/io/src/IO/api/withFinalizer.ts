/**
 * @tsplus fluent fncts.io.IO withFinalizer
 */
export function withFinalizer_<R, E, A, R1>(
  self: IO<R, E, A>,
  finalizer: (a: A) => URIO<R1, any>,
): IO<R & R1 & Has<Scope>, E, A> {
  return IO.acquireRelease(self, finalizer);
}
