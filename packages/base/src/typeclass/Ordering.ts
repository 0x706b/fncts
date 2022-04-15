export type Ordering = -1 | 0 | 1;

/**
 * @tsplus static fncts.Ordering LT
 */
export const LT = -1;
/**
 * @tsplus static fncts.Ordering EQ
 */
export const EQ = 0;
/**
 * @tsplus static fncts.Ordering GT
 */
export const GT = 1;

/**
 * @tsplus type fncts.Ordering
 */
export interface OrderingOps {}

export const Ordering: OrderingOps = {};

/**
 * @tsplus static fncts.Ordering sign
 */
export function sign(n: number): Ordering {
  return n <= -1 ? Ordering.LT : n >= 1 ? Ordering.GT : Ordering.EQ;
}

/**
 * @tsplus static fncts.Ordering invert
 */
export function invert(O: Ordering): Ordering {
  switch (O) {
    case Ordering.LT:
      return Ordering.GT;
    case Ordering.GT:
      return Ordering.LT;
    case Ordering.EQ:
      return Ordering.EQ;
  }
}
