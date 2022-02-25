import { Conc } from "../../../collection/immutable/Conc";
import { Cause } from "../../../data/Cause";
import { Exit } from "../../../data/Exit";
import { FiberId } from "../../../data/FiberId";
import { identity } from "../../../data/function";
import { AtomicNumber } from "../../../internal/AtomicNumber";
import { Future } from "../../Future";
import { PQueue, Queue } from "../../Queue";
import { IO } from "../definition";

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
 * @tsplus static fncts.control.IOOps foreachDiscardC
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
 * @tsplus static fncts.control.IOOps foreachC
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
      ).chain((fibers) =>
        restore(future.await).matchCauseIO(
          (cause) =>
            foreachConcurrentUnbounded(fibers, (f) => f.interrupt).chain((exits) =>
              Exit.collectAllC(exits).match(
                () => IO.failCauseNow(cause.stripFailures),
                (exit) =>
                  exit.isFailure() ? IO.failCauseNow(Cause.both(cause.stripFailures, exit.cause)) : IO.failCauseNow(cause.stripFailures),
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
    .chain((array) =>
      foreachConcurrentUnboundedDiscard(as.zipWithIndex, ([n, a]) =>
        IO.defer(f(a)).chain((b) =>
          IO.succeed(() => {
            array[n] = b;
          }),
        ),
      ).chain(() => IO.succeed(array)),
    )
    .map(Conc.from);
}

function foreachConcurrentBoundedDiscardWorker<R, E, A>(queue: Queue<A>, f: (a: A) => IO<R, E, any>): IO<R, E, void> {
  return queue.poll.chain((ma) =>
    ma.match(
      () => IO.unit,
      (a) => f(a).chain(() => foreachConcurrentBoundedDiscardWorker(queue, f)),
    ),
  );
}

function foreachConcurrentBoundedDiscard<R, E, A>(as: Iterable<A>, n: number, f: (a: A) => IO<R, E, any>): IO<R, E, void> {
  return IO.defer(() => {
    const size =
      "length" in as && typeof (as as Iterable<A> & { length: unknown })["length"] === "number"
        ? (as as Iterable<A> & { length: number })["length"]
        : as.size;

    if (size === 0) {
      return IO.unit;
    }

    return IO.gen(function* (_) {
      const queue = yield* _(Queue.makeBounded<A>(size));
      yield* _(queue.offerAll(as));
      yield* _(foreachConcurrentUnboundedDiscard(foreachConcurrentBoundedDiscardWorker(queue, f).replicate(n), identity));
    });
  });
}

function foreachConcurrentBoundedWorker<R, E, A, B>(
  queue: Queue<readonly [number, A]>,
  array: Array<any>,
  f: (a: A) => IO<R, E, B>,
): IO<R, E, void> {
  return queue.poll.chain((ma) =>
    ma.match(
      () => IO.unit,
      ([n, a]) =>
        f(a)
          .tap((b) =>
            IO.succeed(() => {
              array[n] = b;
            }),
          )
          .chain(() => foreachConcurrentBoundedWorker(queue, array, f)),
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
    return IO.gen(function* (_) {
      const array = yield* _(IO.succeed(new Array<B>(size)));
      const queue = yield* _(Queue.makeBounded<readonly [number, A]>(size));
      yield* _(queue.offerAll(as.zipWithIndex));
      yield* _(foreachConcurrentUnboundedDiscard(foreachConcurrentBoundedWorker(queue, array, f).replicate(n), identity));
      return Conc.from(array);
    });
  });
}
