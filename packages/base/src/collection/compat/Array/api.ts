import type { Eq } from "@fncts/base/typeclass";
/**
 * @tsplus getter fncts.Array elem
 * @tsplus getter fncts.ReadonlyArray elem
 */
export function elem<A>(self: ReadonlyArray<A>) {
  return (eq: Eq<A>) =>
    (a: A): boolean => {
      for (let i = 0; i < self.length; i++) {
        if (eq.equals(a)(self[i]!)) {
          return true;
        }
      }
      return false;
    };
}

/**
 * @tsplus fluent fncts.Array isEmpty
 * @tsplus fluent fncts.ReadonlyArray isEmpty
 */
export function isEmpty<A>(self: ReadonlyArray<A>): boolean {
  return self.length === 0;
}

/**
 * @tsplus fluent fncts.Array isNonEmpty
 * @tsplus fluent fncts.ReadonlyArray isNonEmpty
 */
export function isNonEmpty<A>(self: ReadonlyArray<A>): self is ReadonlyNonEmptyArray<A> {
  return self.length > 0;
}

/**
 * @tsplus pipeable fncts.Array foldLeft
 * @tsplus pipeable fncts.ReadonlyArray foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.Array foldLeftWithIndex
 * @tsplus pipeable fncts.ReadonlyArray foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    let out = b;
    for (let i = 0; i < self.length; i++) {
      out = f(i, out, self[i]!);
    }
    return out;
  };
}
