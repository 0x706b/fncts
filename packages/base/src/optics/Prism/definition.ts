import type { getOrModify } from "../Optional.js";

import { identity } from "../../data/function.js";
import { POptional } from "../Optional.js";

/**
 * @tsplus type fncts.optics.PPrism
 */
export interface PPrism<S, T, A, B> extends POptional<S, T, A, B> {
  readonly reverseGet: reverseGet<T, B>;
}

/**
 * @tsplus type fncts.optics.PPrismOps
 */
export interface PPrismOps {}

export const PPrism: PPrismOps = {};

export interface PPrismMin<S, T, A, B> {
  readonly getOrModify: getOrModify<S, T, A>;
  readonly reverseGet: reverseGet<T, B>;
}

/**
 * @tsplus static fncts.optics.PPrismOps __call
 */
export function mkPPrism<S, T, A, B>(F: PPrismMin<S, T, A, B>): PPrism<S, T, A, B> {
  return {
    reverseGet: F.reverseGet,
    ...POptional({
      getOrModify: F.getOrModify,
      replace_: (s, b) => F.getOrModify(s).match(identity, () => F.reverseGet(b)),
    }),
  };
}

/**
 * @tsplus type fncts.optics.Prism
 */
export interface Prism<S, A> extends PPrism<S, S, A, A> {}

/**
 * @tsplus type fncts.optics.PrismOps
 */
export interface PrismOps extends PPrismOps {}

export const Prism: PrismOps = {};

/**
 * @tsplus static fncts.optics.PrismOps __call
 */
export function mkPrism<S, A>(F: PPrismMin<S, S, A, A>): Prism<S, A> {
  return PPrism(F);
}

export interface reverseGet<T, B> {
  (b: B): T;
}
