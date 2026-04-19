/**
 * Adds a finalizer to the current scope that receives the exit value when the scope closes.
 *
 * @tsplus static fncts.io.IOOps addFinalizerExit
 */
export function addFinalizerExit<R>(
  finalizer: (exit: Exit<any, any>) => URIO<R, any>,
  __tsplusTrace?: string,
): IO<R | Scope, never, void> {
  return Do((Δ) => {
    const environment = Δ(IO.environment<R>());
    const scope       = Δ(IO.scope);
    Δ(scope.addFinalizerExit(Finalizer.get((exit) => finalizer(exit).provideEnvironment(environment))));
  });
}
