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
    return f(new Grafter(scope));
  });
}

export class Grafter {
  constructor(private readonly scope: FiberScope) {}

  graft = <R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> =>
    FiberRef.forkScopeOverride.locally(Just(this.scope))(io);

  graftOnExit = <R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> =>
    this.graftOnExitWith(io, () => IO.unit);

  graftOnExitWith = <R, E, A>(
    io: IO<R, E, A>,
    ensuring: (exit: Exit<E, A>) => void,
    __tsplusTrace?: string,
  ): IO<R, E, A> =>
    IO.uninterruptibleMask((restore) =>
      restore(io).exitWith((exit) =>
        IO.withFiberRuntime((fiber) => {
          fiber.transferChildren(this.scope);
          ensuring(exit);
          return exit;
        }),
      ),
    );
}
