/**
 * @tsplus type fncts.Ord
 */
export interface Ord<A> extends Eq<A> {
  readonly compare: (y: A) => (x: A) => Ordering;
}

/**
 * @tsplus type fncts.OrdOps
 */
export interface OrdOps {}

export const Ord: OrdOps = {};

/**
 * @tsplus static fncts.OrdOps __call
 */
export function makeOrd<A>(O: Ord<A>): Ord<A> {
  return {
    ...Eq(O),
    compare: O.compare,
  };
}
