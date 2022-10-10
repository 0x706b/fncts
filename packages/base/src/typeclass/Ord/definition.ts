import type { Ordering } from "@fncts/base/typeclass/Ordering";

import { Eq } from "@fncts/base/typeclass/Eq";
/**
 * @tsplus type fncts.Ord
 */
export interface Ord<A> extends Eq<A> {
  readonly compare: (x: A, y: A) => Ordering;
}
/**
 * @tsplus type fncts.OrdOps
 */
export interface OrdOps {}
export const Ord: OrdOps = {};
/**
 * @tsplus static fncts.OrdOps __call
 */
export function mkOrd<A>(O: Ord<A>): Ord<A> {
  return {
    ...Eq(O),
    compare: O.compare,
  };
}
