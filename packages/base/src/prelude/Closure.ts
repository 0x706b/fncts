/**
 * @tsplus type fncts.Closure
 */
export interface Closure<A> {
  readonly combine_: (x: A, y: A) => A;
  readonly combine: (y: A) => (x: A) => A;
}

/**
 * @tsplus type fncts.ClosureOps
 */
export interface ClosureOps {}

export const Closure: ClosureOps = {};

export type ClosureMin<A> = {
  combine_: combine_<A>;
};

/**
 * @tsplus static fncts.ClosureOps __call
 */
export function mkClosure<A>(F: ClosureMin<A>): Closure<A> {
  return {
    combine_: F.combine_,
    combine: (y) => (x) => F.combine_(x, y),
  };
}

export interface combine_<A> {
  (x: A, y: A): A;
}

export interface combine<A> {
  (y: A): (x: A) => A;
}
