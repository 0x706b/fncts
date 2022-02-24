import { isEquatable } from "./definition";
import { createCircularEqualCreator, createComparator, sameValueZeroEqual } from "./fast-equals";

/**
 * @tsplus static fncts.prelude.structural.EquatableOps deepEquals
 */
export const deepEquals = createComparator(
  createCircularEqualCreator((eq) => (a, b, meta) => {
    if (isEquatable(a)) {
      return a[Symbol.equatable](b);
    } else if (isEquatable(b)) {
      return b[Symbol.equatable](a);
    } else {
      return eq(a, b, meta);
    }
  }),
);

/**
 * @tsplus static fncts.prelude.structural.EquatableOps strictEquals
 */
export function strictEquals(a: unknown, b: unknown): boolean {
  if (isEquatable(a)) {
    return a[Symbol.equatable](b);
  } else if (isEquatable(b)) {
    return b[Symbol.equatable](a);
  }
  return sameValueZeroEqual(a, b);
}
