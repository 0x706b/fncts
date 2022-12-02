export type Grafter = <R, E, A>(effect: IO<R, E, A>) => IO<R, E, A>;

/**
 * Transplants specified effects so that when those effects fork other
 * effects, the forked effects will be governed by the scope of the
 * fiber that executes this effect.
 *
 * This can be used to "graft" deep grandchildren onto a higher-level
 * scope, effectively extending their lifespans into the parent scope.
 *
 * @tsplus static fncts.io.IOOps transplant
 */
export function transplant<R, E, A>(f: (_: Grafter) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IO.withFiberRuntime((fiberState) => {
    const scopeOverride = fiberState.getFiberRef(FiberRef.forkScopeOverride);
    const scope         = scopeOverride.getOrElse(fiberState.scope);
    return f(FiberRef.forkScopeOverride.locally(Just(scope)));
  });
}
