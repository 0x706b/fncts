/**
 * @tsplus static fncts.io.IOOps addFinalizerExit
 */
export function addFinalizerExit<R>(finalizer: (exit: Exit<any, any>) => URIO<R, any>): IO<R | Scope, never, void> {
  return Do((_) => {
    const environment = _(IO.environment<R>());
    const scope       = _(IO.scope);
    _(scope.addFinalizerExit(Finalizer.get((exit) => finalizer(exit).provideEnvironment(environment))));
  });
}
