import { assert } from "@fncts/base/util/assert";

import { Effect, RetryException } from "../STM/definition.js";

/**
 * @tsplus getter fncts.io.TSemaphore acquire
 */
export function acquire(self: TSemaphore): USTM<void> {
  return self.acquireN(1);
}

/**
 * @tsplus fluent fncts.io.TSemaphore acquireN
 */
export function acquireN_(self: TSemaphore, n: number): USTM<void> {
  return new Effect((journal) => {
    assert(n >= 0, "Negative permits given to TSemaphore#acquire");

    const value = TSemaphore.reverseGet(self).unsafeGet(journal);

    if (value < n) throw new RetryException();
    else return TSemaphore.reverseGet(self).unsafeSet(journal, value - n);
  });
}

/**
 * @tsplus getter fncts.io.TSemaphore available
 */
export function available(self: TSemaphore): USTM<number> {
  return TSemaphore.reverseGet(self).get;
}

/**
 * @tsplus getter fncts.io.TSemaphore release
 */
export function release(self: TSemaphore): USTM<void> {
  return self.releaseN(1);
}

/**
 * @tsplus fluent fncts.io.TSemaphore releaseN
 */
export function releaseN_(self: TSemaphore, n: number): USTM<void> {
  return new Effect((journal) => {
    assert(n >= 0, "Negative permits given to TSemaphore#releaseN");

    const current = TSemaphore.reverseGet(self).unsafeGet(journal);
    TSemaphore.reverseGet(self).unsafeSet(journal, current + n);
  });
}

/**
 * @tsplus getter fncts.io.TSemaphore withPermits
 */
export function withPermits(self: TSemaphore) {
  return (n: number) =>
    <R, E, A>(io: IO<R, E, A>) =>
      IO.uninterruptibleMask(({ restore }) =>
        restore(self.acquireN(n).commit).apSecond(restore(io).ensuring(self.releaseN(n).commit)),
      );
}

/**
 * @tsplus getter fncts.io.TSemaphore withPermit
 */
export function withPermit(self: TSemaphore) {
  return <R, E, A>(io: IO<R, E, A>) => self.withPermits(1)(io);
}
