/**
 * @tsplus getter fncts.io.IO sequentialFinalizers
 */
export function sequentialFinalizers<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IO.environmentWithIO((environment) =>
    environment.getMaybe(Scope.Tag).match(
      () => IO.defer(io),
      (scope) => {
        if (scope.executionStrategy._tag === "Sequential") {
          return IO.defer(io);
        } else {
          return scope.forkWith(ExecutionStrategy.sequential).flatMap((scope) => scope.extend(io));
        }
      },
    ),
  );
}

/**
 * @tsplus getter fncts.io.IO concurrentFinalizers
 */
export function concurrentFinalizers<R, E, A>(io: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IO.environmentWithIO((environment) =>
    environment.getMaybe(Scope.Tag).match(
      () => IO.defer(io),
      (scope) => {
        if (scope.executionStrategy._tag === "Concurrent") {
          return IO.defer(io);
        } else {
          return scope.forkWith(ExecutionStrategy.concurrent).flatMap((scope) => scope.extend(io));
        }
      },
    ),
  );
}

/**
 * @tsplus static fncts.io.IOOps concurrentFinalizersMask
 */
export function concurrentFinalizersMask<R, E, A>(
  f: (restore: <R, E, A>(io: IO<R, E, A>) => IO<R, E, A>) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.environmentWithIO((environment) =>
    environment.getMaybe(Scope.Tag).match(
      () => f(Function.identity),
      (scope) =>
        scope.executionStrategy.match(
          () => f(sequentialFinalizersRestorer).concurrentFinalizers,
          () => f(concurrentFinalizersRestorer).concurrentFinalizers,
          (n) => f((io) => concurrentBoundedFinalizersRestorer(io, n)).concurrentFinalizers,
        ),
    ),
  );
}

function sequentialFinalizersRestorer<R, E, A>(io: IO<R, E, A>): IO<R, E, A> {
  return io.sequentialFinalizers;
}

function concurrentFinalizersRestorer<R, E, A>(io: IO<R, E, A>): IO<R, E, A> {
  return io.concurrentFinalizers;
}

function concurrentBoundedFinalizersRestorer<R, E, A>(io: IO<R, E, A>, n: number): IO<R, E, A> {
  return IO.environmentWithIO((environment) =>
    environment.getMaybe(Scope.Tag).match(
      () => io,
      (scope) => {
        if (scope.executionStrategy._tag === "ConcurrentBounded") {
          return io;
        } else {
          return scope.forkWith(ExecutionStrategy.concurrentBounded(n)).flatMap((scope) => scope.extend(io));
        }
      },
    ),
  );
}
