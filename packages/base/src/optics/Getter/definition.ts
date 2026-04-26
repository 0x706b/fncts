import type { Fold, FoldPartiallyApplied } from "@fncts/base/optics/Fold";

export interface get<S, A> {
  (s: S): A;
}

export interface getPartiallyApplied<A> {
  (): A;
}

/**
 * Represents a getter that focuses on exactly one value within a source.
 *
 * @tsplus type fncts.optics.Getter
 */
export interface Getter<S, A> extends Fold<S, A> {
  readonly get: get<S, A>;
}

export interface GetterPartiallyApplied<A> extends FoldPartiallyApplied<A> {
  readonly get: getPartiallyApplied<A>;
}

/**
 * Provides static constructors and helpers for building `Getter` values.
 *
 * @tsplus type fncts.optics.GetterOps
 */
export interface GetterOps {}

/**
 * Exposes the namespace object for `Getter` constructors and extensions.
 */
export const Getter: GetterOps = {};

export interface GetterMin<S, A> {
  readonly get: get<S, A>;
}

/**
 * Builds a `Getter` from a minimal `get` implementation and derives `foldMap` from it.
 *
 * @tsplus static fncts.optics.GetterOps __call
 */
export function makeGetter<S, A>(F: GetterMin<S, A>): Getter<S, A> {
  return {
    get: F.get,
    foldMap: (_) => (f) => (s) => f(F.get(s)),
  };
}
