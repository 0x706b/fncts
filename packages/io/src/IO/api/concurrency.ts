/**
 * The number of fibers used for concurrent operators.
 */
export const Concurrency: FiberRef<Maybe<number>> = FiberRef.unsafeMake(Nothing());
/**
 * Retrieves the maximum number of fibers for concurrent operators or `Nothing` if
 * it is unbounded.
 *
 * @tsplus static fncts.io.IOOps concurrency
 */
export const concurrency: UIO<Maybe<number>> = Concurrency.get;
/**
 * Retrieves the current maximum number of fibers for concurrent operators and
 * uses it to run the specified effect.
 *
 * @tsplus static fncts.io.IOOps concurrencyWith
 */
export function concurrencyWith<R, E, A>(
  f: (concurrency: Maybe<number>) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return Concurrency.getWith(f);
}
/**
 * Runs the specified effect with the specified maximum number of fibers for
 * concurrent operators.
 *
 * @tsplus pipeable fncts.io.IO withConcurrency
 */
export function withConcurrency(n: number, __tsplusTrace?: string) {
  return <R, E, A>(ma: IO<R, E, A>): IO<R, E, A> => {
    return IO.defer(Concurrency.locally(Just(n))(ma));
  };
}
/**
 * Runs the specified effect with an unbounded maximum number of fibers for
 * concurrent operators.
 *
 * @tsplus getter fncts.io.IO withConcurrencyUnbounded
 */
export function withConcurrencyUnbounded<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IO.defer(Concurrency.locally(Nothing())(ma));
}

export type ConcurrencyRestorer = <R, E, A>(io: IO<R, E, A>) => IO<R, E, A>;

const MakeConcurrent =
  (n: number): ConcurrencyRestorer =>
  (io) =>
    io.withConcurrency(n);

const MakeConcurrentUnbounded: ConcurrencyRestorer = (io) => io.withConcurrencyUnbounded;

/**
 * @tsplus static fncts.io.IOOps withConcurrencyMask
 */
export function withConcurrencyMask<R, E, A>(n: number, f: (restore: ConcurrencyRestorer) => IO<R, E, A>): IO<R, E, A> {
  return Concurrency.getWith((concurrency) =>
    concurrency.match(
      () => Concurrency.locally(Just(n))(f(MakeConcurrentUnbounded)),
      (n0) => Concurrency.locally(Just(n))(f(MakeConcurrent(n0))),
    ),
  );
}

/**
 * @tsplus static fncts.io.IOOps withConcurrencyUnboundedMask
 */
export function withConcurrencyUnboundedMask<R, E, A>(f: (restore: ConcurrencyRestorer) => IO<R, E, A>): IO<R, E, A> {
  return Concurrency.getWith((concurrency) =>
    concurrency.match(
      () => Concurrency.locally(Nothing())(f(MakeConcurrentUnbounded)),
      (n0) => Concurrency.locally(Nothing())(f(MakeConcurrent(n0))),
    ),
  );
}
