import { tuple } from "@fncts/base/data/function";
import { AtomicReference } from "@fncts/base/internal/AtomicReference";

/**
 * @tsplus pipeable fncts.io.IO zipConcurrent
 */
export function zipConcurrent<R1, E1, B>(that: IO<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R | R1, E | E1, readonly [A, B]> => {
    return self.zipWithConcurrent(that, tuple);
  };
}

/**
 * @tsplus pipeable fncts.io.IO zipWithConcurrent
 */
export function zipWithConcurrent<A, R1, E1, B, C>(that: IO<R1, E1, B>, f: (a: A, b: B) => C, __tsplusTrace?: string) {
  return <R, E>(self: IO<R, E, A>): IO<R | R1, E | E1, C> => {
    return IO.fiberId.flatMap((fiberId) =>
      IO.uninterruptibleMask((restore) => {
        const future = Future.unsafeMake<void, C>(FiberId.none);
        const ref    = new AtomicReference<Maybe<Either<A, B>>>(Nothing());
        return IO.transplant((graft) =>
          graft(
            restore(self).matchCauseIO(
              (cause) => future.fail(undefined) > IO.failCauseNow(cause),
              (a) =>
                ref.getAndSet(Just(Either.left(a))).match(
                  () => IO.unit,
                  (value) =>
                    value.match(
                      () => IO.unit,
                      (b) => future.succeed(f(a, b)).asUnit,
                    ),
                ),
            ),
          )
            .forkDaemon.zip(
              graft(
                restore(that).matchCauseIO(
                  (cause) => future.fail(undefined) > IO.failCauseNow(cause),
                  (b) =>
                    ref.getAndSet(Just(Either.right(b))).match(
                      () => IO.unit,
                      (value) =>
                        value.match(
                          (a) => future.succeed(f(a, b)).asUnit,
                          () => IO.unit,
                        ),
                    ),
                ),
              ).forkDaemon,
            )
            .flatMap(([left, right]) =>
              restore(future.await).matchCauseIO(
                (cause) =>
                  left
                    .interruptAs(fiberId)
                    .zipConcurrent(right.interruptAs(fiberId))
                    .flatMap(([left, right]) =>
                      left.zipConcurrent(right).match(IO.failCauseNow, () => IO.failCauseNow(cause.stripFailures)),
                    ),
                (c) => left.inheritRefs.zip(right.inheritRefs).as(c),
              ),
            ),
        );
      }),
    );
  };
}
