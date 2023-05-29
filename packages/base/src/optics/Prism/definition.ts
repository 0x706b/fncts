import type { getOrModify, POptionalPartiallyApplied } from "@fncts/base/optics/Optional";

import { identity } from "@fncts/base/data/function";
import { POptional } from "@fncts/base/optics/Optional";

/**
 * @tsplus type fncts.optics.PPrism
 */
export interface PPrism<S, T, A, B> extends POptional<S, T, A, B> {
  readonly reverseGet: reverseGet<T, B>;
}

export interface PPrismPartiallyApplied<T, A, B> extends POptionalPartiallyApplied<T, A, B> {
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
export function makePPrism<S, T, A, B>(F: PPrismMin<S, T, A, B>): PPrism<S, T, A, B> {
  return {
    reverseGet: F.reverseGet,
    ...POptional({
      getOrModify: F.getOrModify,
      set: (b) => (s) => F.getOrModify(s).match({ Left: identity, Right: () => F.reverseGet(b) }),
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
export function makePrism<S, A>(F: PPrismMin<S, S, A, A>): Prism<S, A> {
  return PPrism(F);
}

export interface reverseGet<T, B> {
  (b: B): T;
}
