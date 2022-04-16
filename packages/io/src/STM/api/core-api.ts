import { OnFailure, OnSuccess } from "../definition.js";

/**
 * Recovers from all errors.
 *
 * @tsplus fluent fncts.control.STM catchAll
 */
export function catchAll_<R, E, A, R1, E1, B>(self: STM<R, E, A>, f: (e: E) => STM<R1, E1, B>): STM<R1 & R, E1, A | B> {
  return new OnFailure<R1 & R, E, A | B, E1>(self, f);
}

/**
 * Feeds the value produced by this effect to the specified function,
 * and then runs the returned effect as well to produce its results.
 *
 * @tsplus fluent fncts.control.STM flatMap
 */
export function flatMap_<R, E, A, R1, E1, B>(self: STM<R, E, A>, f: (a: A) => STM<R1, E1, B>): STM<R1 & R, E | E1, B> {
  return new OnSuccess<R1 & R, E | E1, A, B>(self, f);
}

/**
 * Executes the specified finalization transaction whether or
 * not this effect succeeds. Note that as with all STM transactions,
 * if the full transaction fails, everything will be rolled back.
 *
 * @tsplus fluent fncts.control.STM ensuring
 */
export function ensuring_<R, E, A, R1, B>(self: STM<R, E, A>, finalizer: STM<R1, never, B>): STM<R & R1, E, A> {
  return self.matchSTM(
    (e) => finalizer.flatMap(() => STM.failNow(e)),
    (a) => finalizer.flatMap(() => STM.succeedNow(a)),
  );
}

/**
 * Maps the value produced by the effect.
 *
 * @tsplus fluent fncts.control.STM map
 */
export function map_<R, E, A, B>(self: STM<R, E, A>, f: (a: A) => B): STM<R, E, B> {
  return self.flatMap((a) => STM.succeedNow(f(a)));
}

/**
 * Effectfully folds over the `STM` effect, handling both failure and
 * success.
 *
 * @tsplus fluent fncts.control.STM matchSTM
 */
export function matchSTM_<R, E, A, R1, E1, B, R2, E2, C>(
  self: STM<R, E, A>,
  g: (e: E) => STM<R2, E2, C>,
  f: (a: A) => STM<R1, E1, B>,
): STM<R1 & R2 & R, E1 | E2, B | C> {
  return self
    .map(Either.right)
    .catchAll((e) => g(e).map(Either.left))
    .flatMap((ca) => ca.match(STM.succeedNow, f));
}
