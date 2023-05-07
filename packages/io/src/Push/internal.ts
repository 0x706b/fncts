import type { RuntimeFiber } from "@fncts/io/Fiber";

export function withScopedFork<R, E, A>(
  f: (fork: <R, E, A>(io: IO<R, E, A>) => IO<R, never, RuntimeFiber<E, A>>) => IO<R, E, A>,
): IO<R, E, A> {
  return IO.bracketExit(
    Scope.make,
    (scope) => f((io) => io.forkIn(scope)),
    (scope, exit) => scope.close(exit),
  );
}

export function withSwitch<R, E, A>(f: (fork: <R>(io: URIO<R, void>) => URIO<R, void>) => IO<R, E, A>) {
  return withScopedFork((fork) =>
    Do((Δ) => {
      const ref = Δ(Ref.Synchronized.make<Fiber<never, void>>(Fiber.unit));

      const switchFork = <R>(io: URIO<R, void>) => {
        return ref.updateIO((currentFiber) => currentFiber.interruptFork.flatMap(() => fork(io)));
      };

      Δ(f(switchFork));

      const fiber = Δ(ref.get);

      Δ(fiber.join.when(fiber !== undefined));
    }),
  );
}

export function withUnboundedConcurrency<R, E, A>(
  f: (fork: <R>(io: URIO<R, void>) => URIO<R, RuntimeFiber<never, void>>) => IO<R, E, A>,
) {
  return withScopedFork((fork) =>
    Do((Δ) => {
      const fibers = Δ(IO.succeed(new Set<RuntimeFiber<never, void>>()));
      Δ(
        f((io) =>
          Do((Δ) => {
            const fiber = Δ(fork(io));
            Δ(IO(fibers.add(fiber)));
            Δ(fork(fiber.join.ensuring(IO(fibers.delete(fiber)))));
            return fiber;
          }),
        ),
      );
      Δ(Fiber.joinAll(fibers));
    }),
  );
}
