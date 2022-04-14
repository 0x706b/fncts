import { isEquatable } from "@fncts/base/prelude/Equatable/definition";
import {
  createCircularEqualCreator,
  createComparator,
  sameValueZeroEqual,
} from "@fncts/base/prelude/Equatable/fast-equals";

/**
 * @tsplus static fncts.prelude.EquatableOps deepEquals
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
 * @tsplus static fncts.prelude.EquatableOps strictEquals
 * @tsplus operator fncts.prelude.Equatable ==
 */
export function strictEquals<A>(a: A, b: unknown): boolean {
  if (isEquatable(a)) {
    return a[Symbol.equatable](b);
  } else if (isEquatable(b)) {
    return b[Symbol.equatable](a);
  }
  return sameValueZeroEqual(a, b);
}
