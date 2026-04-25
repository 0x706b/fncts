import type { EqualsContext } from "@fncts/base/data/Equatable/definition";

import { isEquatable } from "@fncts/base/data/Equatable/definition";
import {
  createCircularEqualCreator,
  createComparator,
  sameValueZeroEqual,
} from "@fncts/base/data/Equatable/fast-equals";

/**
 * @tsplus static fncts.EquatableOps anything
 */
export const anything: any = Symbol.for("fncts.Equatable.anything");

/**
 * @tsplus static fncts.EquatableOps nothing
 */
export const nothing: any = Symbol.for("fncts.Equatable.nothing");

const deepEqualsComparator = createComparator(
  createCircularEqualCreator((eq) => (a, b, meta) => {
    const equalsContext: EqualsContext = {
      comparator: (a, b) => {
        if (a === anything || b === anything) {
          return true;
        } else if (a === nothing || b === nothing) {
          return false;
        }
        return deepEquals(a, b);
      },
    };

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
    comparator: (a, b) => {
      if (a === anything || b === anything) {
        return true;
      } else if (a === nothing || b === nothing) {
        return false;
      }
      return strictEquals(a, b);
    },
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
