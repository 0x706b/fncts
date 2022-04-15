import type { equals_ } from "@fncts/base/typeclass/Eq";
import type { Ordering } from "@fncts/base/typeclass/Ordering";

import { Eq } from "@fncts/base/typeclass/Eq";

/**
 * @tsplus type fncts.Ord
 */
export interface Ord<A> extends Eq<A> {
  readonly compare_: compare_<A>;
  readonly compare: compare<A>;
}

/**
 * @tsplus type fncts.OrdOps
 */
export interface OrdOps {}

export const Ord: OrdOps = {};

export type OrdMin<A> = {
  compare_: compare_<A>;
  equals_: equals_<A>;
};

/**
 * @tsplus static fncts.OrdOps __call
 */
export function mkOrd<A>(O: OrdMin<A>): Ord<A> {
  return {
    ...Eq(O),
    compare_: O.compare_,
    compare: (y) => (x) => O.compare_(x, y),
  };
}

export interface compare_<A> {
  (x: A, y: A): Ordering;
}

export interface compare<A> {
  (y: A): (x: A) => Ordering;
}
