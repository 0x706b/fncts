/**
 * @tsplus type fncts.prelude.Eq
 */
export interface Eq<A> {
  readonly equals_: equals_<A>;
  readonly equals: equals<A>;
}

/**
 * @tsplus type fncts.prelude.EqOps
 */
export interface EqOps {}

export const Eq: EqOps = {};

export type EqMin<A> = {
  readonly equals_: equals_<A>;
};

/**
 * @tsplus static fncts.prelude.EqOps __call
 */
export function mkEq<A>(F: EqMin<A>): Eq<A> {
  return {
    equals_: F.equals_,
    equals: (y) => (x) => F.equals_(x, y),
  };
}

export interface equals_<A> {
  (x: A, y: A): boolean;
}

export interface equals<A> {
  (y: A): (x: A) => boolean;
}
