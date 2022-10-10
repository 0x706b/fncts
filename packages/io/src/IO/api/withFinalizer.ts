/**
 * @tsplus pipeable fncts.io.IO withFinalizer
 */
export function withFinalizer<A, R1>(finalizer: (a: A) => URIO<R1, any>, __tsplusTrace?: string) {
  return <R, E>(self: IO<R, E, A>): IO<R | R1 | Scope, E, A> => {
    return IO.acquireRelease(self, finalizer);
  };
}
