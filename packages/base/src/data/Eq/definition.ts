/**
 * @tsplus type fncts.Eq
 */
export interface Eq<A> {
  readonly equals: (y: A) => (x: A) => boolean;
}

/**
 * @tsplus type fncts.EqOps
 */
export interface EqOps {}

export const Eq: EqOps = {};

/**
 * @tsplus static fncts.EqOps __call
 */
export function makeEq<A>(E: Eq<A>): Eq<A> {
  return E;
}
