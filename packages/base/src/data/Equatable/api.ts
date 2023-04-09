import type { EqualsContext } from "@fncts/base/data/Equatable/definition";

import { isEquatable } from "@fncts/base/data/Equatable/definition";
import {
  createCircularEqualCreator,
  createComparator,
  sameValueZeroEqual,
} from "@fncts/base/data/Equatable/fast-equals";

const deepEqualsComparator = createComparator(
  createCircularEqualCreator((eq) => (a, b, meta) => {
    const equalsContext: EqualsContext = { comparator: deepEquals };
    if (isEquatable(a)) {
      return a[Symbol.equals](b, equalsContext);
    } else if (isEquatable(b)) {
      return b[Symbol.equals](a, equalsContext);
    } else {
      return eq(a, b, meta);
    }
  }),
);

/**
 * @tsplus static fncts.EquatableOps deepEquals
 */
export function deepEquals<A>(a: A, b: unknown): boolean {
  const context: EqualsContext = { comparator: deepEquals };
  if (isEquatable(a)) {
    return a[Symbol.equals](b, context);
  } else if (isEquatable(b)) {
    return b[Symbol.equals](a, context);
  } else {
    return deepEqualsComparator(a, b);
  }
}

/**
 * @tsplus static fncts.EquatableOps strictEquals
 * @tsplus operator fncts.Equatable ==
 */
export function strictEquals<A>(a: A, b: unknown): boolean {
  const context: EqualsContext = {
    comparator: strictEquals,
  };
  if (isEquatable(a)) {
    return a[Symbol.equals](b, context);
  } else if (isEquatable(b)) {
    return b[Symbol.equals](a, context);
  }
  return sameValueZeroEqual(a, b);
}

/**
 * @tsplus static fncts.EquatableOps strictNotEquals
 * @tsplus operator fncts.Equatable !=
 */
export function strictNotEquals<A>(a: A, b: unknown): boolean {
  return !strictEquals(a, b);
}
