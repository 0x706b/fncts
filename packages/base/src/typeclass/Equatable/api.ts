import { isEquatable } from "@fncts/base/typeclass/Equatable/definition";
import {
  createCircularEqualCreator,
  createComparator,
  sameValueZeroEqual,
} from "@fncts/base/typeclass/Equatable/fast-equals";

/**
 * @tsplus static fncts.EquatableOps deepEquals
 */
export const deepEquals = createComparator(
  createCircularEqualCreator((eq) => (a, b, meta) => {
    if (isEquatable(a)) {
      return a[Symbol.equals](b);
    } else if (isEquatable(b)) {
      return b[Symbol.equals](a);
    } else {
      return eq(a, b, meta);
    }
  }),
);

/**
 * @tsplus static fncts.EquatableOps strictEquals
 * @tsplus operator fncts.Equatable ==
 */
export function strictEquals<A>(a: A, b: unknown): boolean {
  if (isEquatable(a)) {
    return a[Symbol.equals](b);
  } else if (isEquatable(b)) {
    return b[Symbol.equals](a);
  }
  return sameValueZeroEqual(a, b);
}
