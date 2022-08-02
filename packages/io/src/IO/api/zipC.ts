import { tuple } from "@fncts/base/data/function";
import { AtomicReference } from "@fncts/base/internal/AtomicReference";

/**
 * @tsplus fluent fncts.io.IO zipC
 */
export function zipC_<R, E, A, R1, E1, B>(self: IO<R, E, A>, that: IO<R1, E1, B>): IO<R | R1, E | E1, readonly [A, B]> {
  return self.zipWithC(that, tuple);
}

/**
 * @tsplus fluent fncts.io.IO zipWithC
 */
export function zipWithC_<R, E, A, R1, E1, B, C>(
  self: IO<R, E, A>,
  that: IO<R1, E1, B>,
  f: (a: A, b: B) => C,
): IO<R | R1, E | E1, C> {
  return IO.descriptorWith((descriptor) =>
    IO.uninterruptibleMask(({ restore }) => {
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
                  .interruptAs(descriptor.id)
                  .zipC(right.interruptAs(descriptor.id))
                  .flatMap(([left, right]) =>
                    left.zipC(right).match(IO.failCauseNow, () => IO.failCauseNow(cause.stripFailures)),
                  ),
              (c) => left.inheritRefs.zip(right.inheritRefs).as(c),
            ),
          ),
      );
    }),
  );
}
