import { assert } from "@fncts/base/util/assert";

import { Effect, RetryException } from "../STM/definition.js";

/**
 * @tsplus getter fncts.io.TSemaphore acquire
 */
export function acquire(self: TSemaphore, __tsplusTrace?: string): USTM<void> {
  return self.acquireN(1);
}

/**
 * @tsplus pipeable fncts.io.TSemaphore acquireN
 */
export function acquireN(n: number, __tsplusTrace?: string) {
  return (self: TSemaphore): USTM<void> => {
    return new Effect((journal) => {
      assert(n >= 0, "Negative permits given to TSemaphore#acquireN");
      const value = TSemaphore.reverseGet(self).unsafeGet(journal);
      if (value < n) throw new RetryException();
      else return TSemaphore.reverseGet(self).unsafeSet(journal, value - n);
    });
  };
}

/**
 * @tsplus getter fncts.io.TSemaphore available
 */
export function available(self: TSemaphore, __tsplusTrace?: string): USTM<number> {
  return TSemaphore.reverseGet(self).get;
}

/**
 * @tsplus getter fncts.io.TSemaphore release
 */
export function release(self: TSemaphore, __tsplusTrace?: string): USTM<void> {
  return self.releaseN(1);
}

/**
 * @tsplus pipeable fncts.io.TSemaphore releaseN
 */
export function releaseN(n: number, __tsplusTrace?: string) {
  return (self: TSemaphore): USTM<void> => {
    return new Effect((journal) => {
      assert(n >= 0, "Negative permits given to TSemaphore#releaseN");
      const current = TSemaphore.reverseGet(self).unsafeGet(journal);
      TSemaphore.reverseGet(self).unsafeSet(journal, current + n);
    });
  };
}

/**
 * @tsplus getter fncts.io.TSemaphore withPermits
 */
export function withPermits(self: TSemaphore, __tsplusTrace?: string) {
  return (n: number) =>
    <R, E, A>(io: IO<R, E, A>) =>
      IO.uninterruptibleMask(({ restore }) =>
        restore(self.acquireN(n).commit).apSecond(restore(io).ensuring(self.releaseN(n).commit)),
      );
}

/**
 * @tsplus getter fncts.io.TSemaphore withPermit
 */
export function withPermit(self: TSemaphore, __tsplusTrace?: string) {
  return <R, E, A>(io: IO<R, E, A>) => self.withPermits(1)(io);
}
