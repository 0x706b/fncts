import type { InterruptibilityRestorer } from "./interrupt.js";
import type { Grafter } from "./transplant.js";

import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";

/**
 * @tsplus pipeable fncts.io.IO zipConcurrent
 */
export function zipConcurrent<R1, E1, B>(that: IO<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R | R1, E | E1, Zipped.Make<A, B>> => {
    return self.zipWithConcurrent(that, (a, b) => Zipped(a, b));
  };
}

/**
 * @tsplus pipeable fncts.io.IO zipWithConcurrent
 */
export function zipWithConcurrent<A, R1, E1, B, C>(that: IO<R1, E1, B>, f: (a: A, b: B) => C, __tsplusTrace?: string) {
  return <R, E>(self: IO<R, E, A>): IO<R | R1, E | E1, C> => {
    return IO.uninterruptibleMask((restore) => {
      return IO.transplant((graft) => {
        const future = Future.unsafeMake<void, void>(FiberId.none);
        const ref    = new AtomicBoolean(false);
        return fork(self, restore, graft, future, ref)
          .zip(fork(that, restore, graft, future, ref))
          .flatMap(([left, right]) =>
            restore(future.await).matchCauseIO(
              (cause) =>
                left.interruptFork >
                right.interruptFork >
                left.await.zip(right.await).flatMap(([left, right]) =>
                  left
                    .zipWithCause(right, f, (a, b) => Cause.parallel(a, b))
                    .match(
                      (causes) => IO.refailCause(Cause.parallel(cause.stripFailures, causes)),
                      () => IO.refailCause(cause.stripFailures),
                    ),
                ),
              () => left.join.zipWith(right.join, f),
            ),
          );
      });
    });
  };
}

function fork<R, E, A, C>(
  io: Lazy<IO<R, E, A>>,
  restore: InterruptibilityRestorer,
  graft: Grafter,
  future: Future<void, void>,
  ref: AtomicBoolean,
): IO<R, never, Fiber<E, A>> {
  return graft(restore(io())).matchCauseIO(
    (cause) => future.fail(undefined) > IO.refailCause(cause),
    (a) => {
      if (ref.getAndSet(true)) {
        future.unsafeDone(IO.unit);
      }
      return IO.succeedNow(a);
    },
  ).forkDaemon;
}
