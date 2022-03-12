import type { combine_ } from "./Closure.js";
import type { SemigroupMin } from "./Semigroup.js";

import { Semigroup } from "./Semigroup.js";

/**
 * @tsplus type fncts.Monoid
 */
export interface Monoid<A> extends Semigroup<A> {
  readonly nat: A;
}

/**
 * @tsplus type fncts.MonoidOps
 */
export interface MonoidOps {}

export const Monoid: MonoidOps = {};

export type MonoidMin<A> = SemigroupMin<A> & {
  readonly nat: A;
};

/**
 * @tsplus static fncts.MonoidOps __call
 */
export function mkMonoid<A>(F: MonoidMin<A>): Monoid<A> {
  return {
    ...Semigroup(F),
    nat: F.nat,
  };
}
