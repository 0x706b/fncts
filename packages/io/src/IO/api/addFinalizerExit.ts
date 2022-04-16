/**
 * @tsplus static fncts.io.IOOps addFinalizerExit
 */
export function addFinalizerExit<R>(
  finalizer: (exit: Exit<any, any>) => URIO<R, any>,
): IO<R & Has<Scope>, never, void> {
  return IO.gen(function* (_) {
    const environment = yield* _(IO.environment<R>());
    const scope       = yield* _(IO.scope);
    yield* _(scope.addFinalizerExit(Finalizer.get((exit) => finalizer(exit).provideEnvironment(environment))));
  });
}
