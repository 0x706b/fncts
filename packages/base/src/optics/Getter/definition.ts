import type { Fold } from "../Fold.js";

export interface get<S, A> {
  (s: S): A;
}

/**
 * @tsplus type fncts.optics.Getter
 */
export interface Getter<S, A> extends Fold<S, A> {
  readonly get: get<S, A>;
}

/**
 * @tsplus type fncts.optics.GetterOps
 */
export interface GetterOps {}

export const Getter: GetterOps = {};

export interface GetterMin<S, A> {
  readonly get: get<S, A>;
}

/**
 * @tsplus static fncts.optics.GetterOps __call
 */
export function mkGetter<S, A>(F: GetterMin<S, A>): Getter<S, A> {
  return {
    get: F.get,
    foldMap_: (_) => (s, f) => f(F.get(s)),
    foldMap: (_) => (f) => (s) => f(F.get(s)),
  };
}
