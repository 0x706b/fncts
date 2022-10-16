import type { Closure } from "@fncts/base/typeclass/Closure";

import { makeClosure } from "@fncts/base/typeclass/Closure";

/**
 * @tsplus type fncts.Semigroup
 */
export interface Semigroup<A> extends Closure<A> {}

/**
 * @tsplus type fncts.SemigroupOps
 */
export interface SemigroupOps {}

export const Semigroup: SemigroupOps = {};

/**
 * @tsplus static fncts.SemigroupOps __call
 */
export const makeSemigroup = makeClosure;
