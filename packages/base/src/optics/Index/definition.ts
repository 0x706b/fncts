import type { Optional } from "../Optional.js";

/**
 * @tsplus type fncts.optics.Index
 */
export interface Index<S, I, A> {
  readonly index: (i: I) => Optional<S, A>;
}

export type IndexMin<S, I, A> = Index<S, I, A>;

/**
 * @tsplus type fncts.optics.IndexOps
 */
export interface IndexOps {}

export const Index: IndexOps = {};

/**
 * @tsplus static fncts.optics.IndexOps __call
 */
export function mkIndex<S, I, A>(F: IndexMin<S, I, A>): Index<S, I, A> {
  return { index: F.index };
}
