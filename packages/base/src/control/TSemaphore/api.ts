import type { USTM } from "../STM/definition";

import { assert } from "../../util/assert";
import { IO } from "../IO";
import { Effect, RetryException } from "../STM/definition";
import { TSemaphore } from "./definition";

/**
 * @tsplus getter fncts.control.TSemaphore acquire
 */
export function acquire(self: TSemaphore): USTM<void> {
  return self.acquireN(1);
}

/**
 * @tsplus fluent fncts.control.TSemaphore acquireN
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
 * @tsplus getter fncts.control.TSemaphore available
 */
export function available(self: TSemaphore): USTM<number> {
  return TSemaphore.reverseGet(self).get;
}

/**
 * @tsplus getter fncts.control.TSemaphore release
 */
export function release(self: TSemaphore): USTM<void> {
  return self.releaseN(1);
}

/**
 * @tsplus fluent fncts.control.TSemaphore releaseN
 */
export function releaseN_(self: TSemaphore, n: number): USTM<void> {
  return new Effect((journal) => {
    assert(n >= 0, "Negative permits given to TSemaphore#releaseN");

    const current = TSemaphore.reverseGet(self).unsafeGet(journal);
    TSemaphore.reverseGet(self).unsafeSet(journal, current + n);
  });
}

/**
 * @tsplus getter fncts.control.TSemaphore withPermits
 */
export function withPermitsSelf(self: TSemaphore) {
  return (n: number) =>
    <R, E, A>(io: IO<R, E, A>) =>
      IO.uninterruptibleMask(({ restore }) =>
        restore(self.acquireN(n).commit).apSecond(
          restore(io).ensuring(self.releaseN(n).commit)
        )
      );
}

/**
 * @tsplus getter fncts.control.TSemaphore withPermit
 */
export function withPermitSelf(self: TSemaphore) {
  return <R, E, A>(io: IO<R, E, A>) => self.withPermits(1)(io);
}
