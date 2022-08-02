/**
 * @tsplus getter fncts.io.IO concurrentFinalizers
 */
export function concurrentFinalizers<R, E, A>(io: IO<R, E, A>): IO<R | Scope, E, A> {
  return Do((Δ) => {
    const outerScope = Δ(IO.scope);
    const innerScope = Δ(Scope.concurrent);
    Δ(outerScope.addFinalizerExit(Finalizer.get((exit) => innerScope.close(exit))));
    return Δ(innerScope.extend(io));
  });
}
