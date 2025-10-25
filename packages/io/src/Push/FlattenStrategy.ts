import { withScope } from "@fncts/io/Push/internal";

type ScopedFork = <R, E, A>(io: IO<R, E, A>) => IO<R | Scope, never, Fiber.Runtime<E, A>>;

type Fork = <R>(io: IO<R, never, void>) => IO<R | Scope, never, void>;

/**
 * @tsplus type fncts.io.Push.FlattenStrategy
 * @tsplus companion fncts.io.Push.FlattenStrategyOps
 */
export abstract class FlattenStrategy {
  abstract withFork<R>(
    f: (fork: Fork, scope: Scope) => IO<R, never, void>,
    executionStrategy: ExecutionStrategy,
  ): IO<R | Scope, never, void>;
}

function withScopedFork<R, E, A>(
  f: (fork: ScopedFork, scope: Scope.Closeable) => IO<R, E, A>,
  executionStrategy: ExecutionStrategy,
): IO<R | Scope, E, A> {
  return withScope((scope) => f((io) => io.forkIn(scope), scope), executionStrategy);
}

/**
 * @tsplus static fncts.io.Push.FlattenStrategyOps Switch
 */
export const SwitchStrategy = new (class SwitchStrategy extends FlattenStrategy {
  withFork<R>(
    f: (fork: Fork, scope: Scope) => IO<R, never, void>,
    executionStrategy: ExecutionStrategy,
  ): IO<R | Scope, never, void> {
    return withScopedFork(
      (fork, scope) =>
        Ref.Synchronized.make<Fiber<never, void>>(Fiber.unit).flatMap(
          (ref) =>
            f((io) => ref.updateIO((fiber) => fiber.interrupt > fork(io)), scope) >
            ref.get.flatMap((fiber) => fiber.join),
        ),
      executionStrategy,
    );
  }
})();

/**
 * @tsplus static fncts.io.Push.FlattenStrategyOps Exhaust
 */
export const ExhaustStrategy = new (class ExhaustStrategy extends FlattenStrategy {
  withFork<R>(
    f: (fork: Fork, scope: Scope) => IO<R, never, void>,
    executionStrategy: ExecutionStrategy,
  ): IO<R | Scope, never, void> {
    return withScopedFork(
      (fork, scope) =>
        Ref.Synchronized.make<Fiber.Runtime<never, void> | null>(null).flatMap(
          (ref) =>
            f(
              (io) =>
                ref.updateIO((fiber) => {
                  if (fiber) {
                    return IO.succeedNow(fiber);
                  } else {
                    return fork(io.onExit(() => ref.set(null)));
                  }
                }),
              scope,
            ) >
            ref.get.flatMap((fiber) => {
              if (fiber) {
                return fiber.join;
              } else {
                return IO.unit;
              }
            }),
        ),
      executionStrategy,
    );
  }
})();

/**
 * @tsplus static fncts.io.Push.FlattenStrategyOps Unbounded
 */
export const UnboundedStrategy = new (class UnboundedStrategy extends FlattenStrategy {
  withFork<R>(f: (fork: Fork, scope: Scope) => IO<R, never, void>): IO<R | Scope, never, void> {
    return IO.scopeWith((scope) =>
      FiberSet.make<never, void>().flatMap((fiberSet) => f((io) => fiberSet.run(io), scope) > Fiber.joinAll(fiberSet)),
    );
  }
})();

/**
 * @tsplus static fncts.io.Push.FlattenStrategyOps Bounded
 */
export function makeBounded(capacity: number): BoundedStrategy {
  return new BoundedStrategy(capacity);
}

class BoundedStrategy extends FlattenStrategy {
  constructor(readonly capacity: number) {
    super();
  }

  withFork<R>(
    f: (fork: Fork, scope: Scope) => IO<R, never, void>,
    executionStrategy: ExecutionStrategy,
  ): IO<R | Scope, never, void> {
    return withScopedFork(
      (fork, scope) =>
        Do((Δ) => {
          const ref       = Δ(Ref.make<HashSet<Fiber.Runtime<never, void>>>(HashSet.empty()));
          const semaphore = Δ(Semaphore.make(this.capacity));
          Δ(
            f(
              (io) =>
                Do((Δ) => {
                  const fiber = Δ(fork(semaphore.withPermit(io)));
                  Δ(ref.update((set) => set.add(fiber)));
                  Δ(scope.addFinalizer(ref.update((set) => set.remove(fiber))));
                }),
              scope,
            ),
          );
          return ref;
        }).flatMap((ref) =>
          ref.get.flatMap((fibers) => {
            if (fibers.size > 0) {
              return Fiber.joinAll(fibers);
            } else {
              return IO.unit;
            }
          }),
        ),
      executionStrategy,
    );
  }
}
