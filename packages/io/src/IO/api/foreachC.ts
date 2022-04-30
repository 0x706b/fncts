import { identity } from "@fncts/base/data/function";
import { AtomicNumber } from "@fncts/base/internal/AtomicNumber";

/**
 * Applies the function `f` to each element of the `Iterable<A>` and runs
 * produced effects in parallel, discarding the results.
 *
 * For a sequential version of this method, see `IO.foreachDiscard`.
 *
 * Optimized to avoid keeping full tree of effects, so that method could be
 * able to handle large input sequences.
 * Behaves almost like this code:
 *
 * Additionally, interrupts all effects on any failure.
 *
 * @tsplus static fncts.io.IOOps foreachDiscardC
 * @tsplus fluent fncts.Iterable traverseIODiscardC
 */
export function foreachDiscardC_<R, E, A>(as: Iterable<A>, f: (a: A) => IO<R, E, any>): IO<R, E, void> {
  return IO.concurrencyWith((conc) =>
    conc.match(
      () => foreachConcurrentUnboundedDiscard(as, f),
      (n) => foreachConcurrentBoundedDiscard(as, n, f),
    ),
  );
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` in parallel,
 * and returns the results in a `Conc<B>`.
 *
 * For a sequential version of this method, see `IO.foreach`.
 *
 * @tsplus static fncts.io.IOOps foreachC
 * @tsplus fluent fncts.Iterable traverseIOC
 */
export function foreachC_<R, E, A, B>(as: Iterable<A>, f: (a: A) => IO<R, E, B>): IO<R, E, Conc<B>> {
  return IO.concurrencyWith((conc) =>
    conc.match(
      () => foreachConcurrentUnbounded(as, f),
      (n) => foreachConcurrentBounded(as, n, f),
    ),
  );
}

function foreachConcurrentUnboundedDiscard<R, E, A>(as: Iterable<A>, f: (a: A) => IO<R, E, any>): IO<R, E, void> {
  return IO.defer(() => {
    const arr  = Array.from(as);
    const size = arr.length;

    if (size === 0) {
      return IO.unit;
    }

    return IO.uninterruptibleMask(({ restore }) => {
      const future = Future.unsafeMake<void, void>(FiberId.none);
      const ref    = new AtomicNumber(0);

      return IO.transplant((graft) =>
        IO.foreach(
          as,
          (a) =>
            graft(
              restore(IO.defer(f(a))).matchCauseIO(
                (cause) => future.fail(undefined).apSecond(IO.failCauseNow(cause)),
                () => {
                  if (ref.incrementAndGet() === size) {
                    future.unsafeDone(IO.unit);
                  }
                  return IO.unit;
                },
              ),
            ).forkDaemon,
        ),
      ).flatMap((fibers) =>
        restore(future.await).matchCauseIO(
          (cause) =>
            foreachConcurrentUnbounded(fibers, (f) => f.interrupt).flatMap((exits) =>
              Exit.collectAllC(exits).match(
                () => IO.failCauseNow(cause.stripFailures),
                (exit) =>
                  exit.isFailure()
                    ? IO.failCauseNow(Cause.both(cause.stripFailures, exit.cause))
                    : IO.failCauseNow(cause.stripFailures),
              ),
            ),
          () => IO.foreachDiscard(fibers, (fiber) => fiber.inheritRefs),
        ),
      );
    });
  });
}

function foreachConcurrentUnbounded<R, E, A, B>(as: Iterable<A>, f: (a: A) => IO<R, E, B>): IO<R, E, Conc<B>> {
  return IO.succeed<B[]>([])
    .flatMap((array) =>
      foreachConcurrentUnboundedDiscard(as.zipWithIndex, ([n, a]) =>
        IO.defer(f(a)).flatMap((b) =>
          IO.succeed(() => {
            array[n] = b;
          }),
        ),
      ).flatMap(() => IO.succeed(array)),
    )
    .map(Conc.from);
}

function foreachConcurrentBoundedDiscardWorker<R, E, A>(queue: Queue<A>, f: (a: A) => IO<R, E, any>): IO<R, E, void> {
  return queue.poll.flatMap((ma) =>
    ma.match(
      () => IO.unit,
      (a) => f(a).flatMap(() => foreachConcurrentBoundedDiscardWorker(queue, f)),
    ),
  );
}

function foreachConcurrentBoundedDiscard<R, E, A>(
  as: Iterable<A>,
  n: number,
  f: (a: A) => IO<R, E, any>,
): IO<R, E, void> {
  return IO.defer(() => {
    const size =
      "length" in as && typeof (as as Iterable<A> & { length: unknown })["length"] === "number"
        ? (as as Iterable<A> & { length: number })["length"]
        : as.size;

    if (size === 0) {
      return IO.unit;
    }

    return Do((Δ) => {
      const queue = Δ(Queue.makeBounded<A>(size));
      Δ(queue.offerAll(as));
      Δ(foreachConcurrentUnboundedDiscard(foreachConcurrentBoundedDiscardWorker(queue, f).replicate(n), identity));
    });
  });
}

function foreachConcurrentBoundedWorker<R, E, A, B>(
  queue: Queue<readonly [number, A]>,
  array: Array<any>,
  f: (a: A) => IO<R, E, B>,
): IO<R, E, void> {
  return queue.poll.flatMap((ma) =>
    ma.match(
      () => IO.unit,
      ([n, a]) =>
        f(a)
          .tap((b) =>
            IO.succeed(() => {
              array[n] = b;
            }),
          )
          .flatMap(() => foreachConcurrentBoundedWorker(queue, array, f)),
    ),
  );
}

function foreachConcurrentBounded<R, E, A, B>(as: Iterable<A>, n: number, f: (a: A) => IO<R, E, B>): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const size =
      "length" in as && typeof (as as Iterable<A> & { length: unknown })["length"] === "number"
        ? (as as Iterable<A> & { length: number })["length"]
        : as.size;

    if (size === 0) {
      return IO.succeed(Conc.empty());
    }
    return Do((Δ) => {
      const array = Δ(IO.succeed(new Array<B>(size)));
      const queue = Δ(Queue.makeBounded<readonly [number, A]>(size));
      Δ(queue.offerAll(as.zipWithIndex));
      Δ(foreachConcurrentUnboundedDiscard(foreachConcurrentBoundedWorker(queue, array, f).replicate(n), identity));
      return Conc.from(array);
    });
  });
}
