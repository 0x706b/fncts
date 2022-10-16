/**
 * @tsplus type fncts.Closure
 */
export interface Closure<A> {
  readonly combine: (y: A) => (x: A) => A;
}

/**
 * @tsplus type fncts.ClosureOps
 */
export interface ClosureOps {}

export const Closure: ClosureOps = {};

/**
 * @tsplus static fncts.ClosureOps __call
 */
export function makeClosure<A>(F: Closure<A>): Closure<A> {
  return F;
}
