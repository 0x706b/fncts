/**
 * @tsplus pipeable fncts.io.IO withFinalizerExit
 */
export function withFinalizerExit<A, R1>(
  finalizer: (a: A, exit: Exit<any, any>) => URIO<R1, any>,
  __tsplusTrace?: string,
) {
  return <R, E>(self: IO<R, E, A>): IO<R | R1 | Scope, E, A> => {
    return IO.acquireReleaseExit(self, finalizer);
  };
}
