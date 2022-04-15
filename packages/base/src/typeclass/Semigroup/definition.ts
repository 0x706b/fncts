import type { Closure, combine_ } from "@fncts/base/typeclass/Closure";

import { mkClosure } from "@fncts/base/typeclass/Closure";

/**
 * @tsplus type fncts.Semigroup
 */
export interface Semigroup<A> extends Closure<A> {}

/**
 * @tsplus type fncts.SemigroupOps
 */
export interface SemigroupOps {}

export const Semigroup: SemigroupOps = {};

export type SemigroupMin<A> = {
  combine_: combine_<A>;
};

/**
 * @tsplus static fncts.SemigroupOps __call
 */
export const mkSemigroup: <A>(F: SemigroupMin<A>) => Semigroup<A> = mkClosure;
