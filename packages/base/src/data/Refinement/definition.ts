/**
 * @tsplus type fncts.Refinement
 */
export interface Refinement<A, B extends A> {
  (a: A): a is B;
}

/**
 * @tsplus type fncts.RefinementWithIndex
 */
export interface RefinementWithIndex<I, A, B extends A> {
  (i: I, a: A): a is B;
}
