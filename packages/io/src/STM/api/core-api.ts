import { OnFailure, OnSuccess } from "../definition.js";

/**
 * Recovers from all errors.
 *
 * @tsplus pipeable fncts.io.STM catchAll
 */
export function catchAll<E, R1, E1, B>(f: (e: E) => STM<R1, E1, B>, __tsplusTrace?: string) {
  return <R, A>(self: STM<R, E, A>): STM<R1 | R, E1, A | B> => {
    return new OnFailure<R1 | R, E, A | B, E1>(self, f);
  };
}

/**
 * Feeds the value produced by this effect to the specified function,
 * and then runs the returned effect as well to produce its results.
 *
 * @tsplus pipeable fncts.io.STM flatMap
 */
export function flatMap<A, R1, E1, B>(f: (a: A) => STM<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E>(self: STM<R, E, A>): STM<R1 | R, E | E1, B> => {
    return new OnSuccess<R1 | R, E | E1, A, B>(self, f);
  };
}

/**
 * Executes the specified finalization transaction whether or
 * not this effect succeeds. Note that as with all STM transactions,
 * if the full transaction fails, everything will be rolled back.
 *
 * @tsplus pipeable fncts.io.STM ensuring
 */
export function ensuring<R1, B>(finalizer: STM<R1, never, B>, __tsplusTrace?: string) {
  return <R, E, A>(self: STM<R, E, A>): STM<R | R1, E, A> => {
    return self.matchSTM(
      (e) => finalizer.flatMap(() => STM.failNow(e)),
      (a) => finalizer.flatMap(() => STM.succeedNow(a)),
    );
  };
}

/**
 * Maps the value produced by the effect.
 *
 * @tsplus pipeable fncts.io.STM map
 */
export function map<A, B>(f: (a: A) => B, __tsplusTrace?: string) {
  return <R, E>(self: STM<R, E, A>): STM<R, E, B> => {
    return self.flatMap((a) => STM.succeedNow(f(a)));
  };
}

/**
 * Effectfully folds over the `STM` effect, handling both failure and
 * success.
 *
 * @tsplus pipeable fncts.io.STM matchSTM
 */
export function matchSTM<E, A, R1, E1, B, R2, E2, C>(
  g: (e: E) => STM<R2, E2, C>,
  f: (a: A) => STM<R1, E1, B>,
  __tsplusTrace?: string,
) {
  return <R>(self: STM<R, E, A>): STM<R1 | R2 | R, E1 | E2, B | C> => {
    return self
      .map(Either.right)
      .catchAll((e) => g(e).map(Either.left))
      .flatMap((ca) => ca.match(STM.succeedNow, f));
  };
}
